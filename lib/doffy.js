'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

let setupViewport = (() => {
  var _ref3 = _asyncToGenerator(function* (opts) {
    opts = opts || {};
    const Emulation = this.client.Emulation;

    const options = this.options;
    const deviceMetrics = {
      width: opts.viewportWidth || options.viewportWidth,
      height: opts.viewportHeight || options.viewportHeight,
      deviceScaleFactor: opts.deviceScaleFactor || options.deviceScaleFactor,
      mobile: opts.mobile || options.mobile,
      fitWindow: opts.fitWindow || options.fitWindow
    };
    yield Emulation.setDeviceMetricsOverride(deviceMetrics);
    yield Emulation.setVisibleSize({ width: deviceMetrics.width, height: deviceMetrics.height }); // not support on android!
  });

  return function setupViewport(_x4) {
    return _ref3.apply(this, arguments);
  };
})();

// setup Event Handlers


function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

/**
 * @authors     : qieguo
 * @date        : 2017/4/26
 * @description :
 */

/**
 * All promise!
 */

const EventEmitter = require('events');
const CDP = require('chrome-remote-interface');
const actions = require('./actions');
const events = require('./events');
const util = require('./util');
const Quene = util.Quene;

var _require = require('lighthouse/lighthouse-cli/chrome-launcher');

const ChromeLauncher = _require.ChromeLauncher;


const defaultConfig = {
  waitTimeout: 5000, // wait command timeout
  execTimeout: 5000, // exec command timeout
  pollInterval: 250, // wait command poll interval
  viewportWidth: 1024,
  viewportHeight: 768,
  deviceScaleFactor: 0,
  mobile: false,
  fitWindow: false,
  screenshotFormat: 'jpeg',
  screenshotQuality: 60,
  pwd: './'
};

class Doffy extends EventEmitter {

  constructor(options) {
    super();
    EventEmitter.call(this);
    this.options = Object.assign(defaultConfig, options);

    // props
    this.props = {
      pageLoaded: false
    };
    this._request = new Quene(1000);

    // bind method
    util.bindMethods(['init', 'action', 'end'], this);
  }

  init() {
    var _this = this;

    return _asyncToGenerator(function* () {
      // const options = this.options;
      const self = _this;
      return new Promise((() => {
        var _ref = _asyncToGenerator(function* (fulfill, reject) {
          _this.chromeLauncher = yield launchChrome(true);
          if (!_this.chromeLauncher) {
            console.error('Can\'t not setup chrome!');
            return;
          }
          CDP((() => {
            var _ref2 = _asyncToGenerator(function* (client) {
              // extract domains
              const Network = client.Network,
                    Page = client.Page,
                    DOM = client.DOM,
                    CSS = client.CSS;

              self.client = client;

              // setup event handlers
              setupEventHandlers.call(self);

              // setup client conf
              setupViewport.call(self);

              yield Promise.all([Page.enable(), DOM.enable(), CSS.enable(), Network.enable()]);

              Object.keys(actions).forEach(function (name) {
                const fn = actions[name].bind(self);
                self.action(name, fn);
              });

              // Object.keys(events).forEach((name) => {
              //   self[`on${events[name]}`] = function(cb) {
              //     return new Promise((resolve, reject) => {
              //       this.on(events[name], (data) => {
              //         resolve(cb(data));
              //       });
              //     });
              //   }
              // });

              fulfill(self);
            });

            return function (_x3) {
              return _ref2.apply(this, arguments);
            };
          })()).on('error', function (err) {
            // cannot connect to the remote endpoint
            reject(err);
          });
        });

        return function (_x, _x2) {
          return _ref.apply(this, arguments);
        };
      })());
    })();
  }

  /**
   * add custom actions to Doffy
   */
  action(name, fn) {
    if (typeof fn === 'function') {
      this[name] = fn;
    }
  }

  end(exit = false) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      try {
        _this2.client.close();
        exit && _this2.chromeLauncher.kill('SIGHUP');
      } catch (err) {
        Promise.reject(err);
      }
    })();
  }
}

/**
 * Launches a debugging instance of Chrome on port 9222.
 * @param {boolean=} headless True (default) to launch Chrome in headless mode.
 *     Set to false to launch Chrome normally.
 * @return {Promise<ChromeLauncher>}
 */
function launchChrome(headless = true) {
  const launcher = new ChromeLauncher({
    port: 9222,
    autoSelectChrome: true, // False to manually select which Chrome install.
    additionalFlags: ['--disable-gpu', headless ? '--headless' : '']
  });

  process.on('exit', code => {
    // console.log('exit process', code);
    launcher.kill();
  });

  process.on('SIGINT', function (data) {
    // console.log('Got SIGINT.  Press Control-D to exit.', data);
    launcher.kill();
  });

  return launcher.run().then(() => launcher).catch(err => launcher.kill().then(() => {
    throw err;
  }, console.error));
}

function setupEventHandlers() {
  var _client = this.client;
  const Network = _client.Network,
        Page = _client.Page;

  Network.requestWillBeSent(data => {
    this._request.put(data);
    this.emit(events.pageLoaded, data);
  });

  Page.loadEventFired(data => {
    this.props.pageLoaded = true;
    this.emit(events.pageLoaded, data);
  });

  Page.domContentEventFired(() => {
    // console.log('======== domContentEventFired ========', data);
    // console.log('======== domContentEventFired ========');
  });

  Page.frameNavigated(() => {
    // console.log('======== frameNavigated  ========');
  });

  Page.frameStartedLoading(() => {
    // console.log('======== frameStartedLoading  ========');
    this.props.pageLoaded = false;
  });
}

exports.default = Doffy;