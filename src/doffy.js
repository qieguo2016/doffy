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

        // setup handlers
        setupHandlers.call(self);

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

        fulfill(self);
      }).on('error', (err) => {
        // cannot connect to the remote endpoint
        reject(err);
      });
    });
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
    if(typeof fn === 'function') {
      this[name] = fn;
    }
  }

  end(exit = false) {
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

  return launcher.run().then(() => launcher)
                 .catch((err) => {
                   return launcher.kill().then(() => { // Kill Chrome if there's an error.
                     throw err;
                   }, console.error);
                 });
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

// setup handlers
function setupHandlers() {
  const { Network, Page } = this.client;
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

export default Doffy;
