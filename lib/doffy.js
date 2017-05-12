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

// setup handlers


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
const util = require('./util');

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
  screenshotQuality: 60
};

class Doffy extends EventEmitter {

  constructor(options) {
    super();
    EventEmitter.call(this);
    this.options = Object.assign(defaultConfig, options);

    // props
    this.props = {};

    // bind method
    util.bindMethods(['init', 'action', 'end'], this);
  }

  init() {
    var _this = this;

    // const options = this.options;
    const self = this;
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

            // setup handlers
            setupHandlers.call(self);

            // setup client conf
            setupViewport.call(self);

            yield Promise.all([Page.enable(), DOM.enable(), CSS.enable(), Network.enable()]);

            Object.keys(actions).forEach(function (name) {
              const fn = actions[name].bind(self);
              self.action(name, fn);
            });

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
  }

  /**
   * Static: Support attaching custom actions
   *
   * @param {String} name - method name
   * @param {Function|Object} [childfn] - Electron implementation
   * @param {Function|Object} parentfn - Nightmare implementation
   * @return {Nightmare}
   */
  action(name, fn) {
    if (typeof fn === 'function') {
      this[name] = fn;
    }
  }

  end(exit = false) {
    try {
      this.client.close();
      exit && this.chromeLauncher.kill('SIGHUP');
    } catch (err) {
      Promise.reject(err);
    }
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

  return launcher.run().then(() => launcher).catch(err => {
    return launcher.kill().then(() => {
      // Kill Chrome if there's an error.
      throw err;
    }, console.error);
  });
}

function setupHandlers() {
  var _client = this.client;
  const Network = _client.Network,
        Page = _client.Page;

  Network.requestWillBeSent(() => {
    // console.log('======== requestWillBeSent ========\r\n', data.request.url);
    // console.log('======== requestWillBeSent ========');
  });

  Page.loadEventFired((...params) => {
    // console.log('======== loadEventFired ========\r\n', ...params);
    // console.log('======== loadEventFired ========');
    // Page.addScriptToEvaluateOnLoad
    this.emit('pageLoaded', ...params);
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
  });
}

exports.default = Doffy;