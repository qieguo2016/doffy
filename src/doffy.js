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
const { ChromeLauncher } = require('lighthouse/lighthouse-cli/chrome-launcher');

const defaultConfig = {
  waitTimeout: 5000,   // wait command timeout
  execTimeout: 5000,   // exec command timeout
  pollInterval: 250,   // wait command poll interval
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
      pageLoaded: false,
    };
    this._request = new Quene(1000);

    // bind method
    util.bindMethods(['init', 'action', 'end'], this);
  }

  async init() {
    // const options = this.options;
    const self = this;
    return new Promise(async(fulfill, reject) => {
      this.chromeLauncher = await launchChrome(true);
      if(!this.chromeLauncher) {
        console.error('Can\'t not setup chrome!');
        return;
      }
      CDP(async(client) => {
        // extract domains
        const { Network, Page, DOM, CSS } = client;
        self.client = client;

        // setup event handlers
        setupEventHandlers.call(self);

        // setup client conf
        setupViewport.call(self);

        await Promise.all([
          Page.enable(),
          DOM.enable(),
          CSS.enable(),
          Network.enable()
        ]);

        Object.keys(actions).forEach((name) => {
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
      }).on('error', (err) => {
        // cannot connect to the remote endpoint
        reject(err);
      });
    });
  }

  /**
   * add custom actions to Doffy
   */
  action(name, fn) {
    if(typeof fn === 'function') {
      this[name] = fn;
    }
  }

  async end(exit = false) {
    try {
      this.client.close();
      exit && this.chromeLauncher.kill('SIGHUP');
    } catch(err) {
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
    additionalFlags: [
      '--disable-gpu',
      headless ? '--headless' : ''
    ]
  });

  process.on('exit', (code) => {
    // console.log('exit process', code);
    launcher.kill();
  });

  process.on('SIGINT', function(data) {
    // console.log('Got SIGINT.  Press Control-D to exit.', data);
    launcher.kill();
  });

  return launcher.run().then(() => launcher)
                 .catch(err => launcher.kill().then(() => { throw err; }, console.error));
}

async function setupViewport(opts) {
  opts = opts || {};
  const { Emulation } = this.client;
  const options = this.options;
  const deviceMetrics = {
    width: opts.viewportWidth || options.viewportWidth,
    height: opts.viewportHeight || options.viewportHeight,
    deviceScaleFactor: opts.deviceScaleFactor || options.deviceScaleFactor,
    mobile: opts.mobile || options.mobile,
    fitWindow: opts.fitWindow || options.fitWindow
  };
  await Emulation.setDeviceMetricsOverride(deviceMetrics);
  await Emulation.setVisibleSize({ width: deviceMetrics.width, height: deviceMetrics.height });  // not support on android!
}

// setup Event Handlers
function setupEventHandlers() {
  const { Network, Page } = this.client;
  Network.requestWillBeSent((data) => {
    this._request.put(data);
    this.emit(events.pageLoaded, data);
  });

  Page.loadEventFired((data) => {
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

export default Doffy;
