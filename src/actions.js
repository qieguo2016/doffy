/**
 * @authors     : qieguo
 * @date        : 2017/5/7
 * @description :
 */

const fs = require('fs');
const path = require('path');
const util = require('./util');
const checkDoffy = util.checkDoffy;

// args should not contain function
// @Note: evaluate context is different from user's script context
exports.evaluate = function evaluate(fn, ...args) {
  checkDoffy(this);
  const exp = args && args.length > 0
    ? `(${String(fn)}).apply(null, ${JSON.stringify(args)})`
    : `(${String(fn)}).apply(null)`;
  return this.client.Runtime.evaluate({
    expression: exp
  });
};

exports.goto = function(url, opt) {
  checkDoffy(this);
  opt = Object.assign({ wait: true }, opt);
  return new Promise((resolve, reject) => {
    const listener = () => {
      this.removeListener('pageLoaded', listener);
      resolve(true);
    };
    this.client.Page.navigate({ url }).then(() => {
      opt.wait && this.on('pageLoaded', listener);
    }).catch(reject);
  });
};

exports.title = function title() {
  return this.evaluate(() => document.title);
};

exports.click = function click(selector) {
  checkDoffy(this);
  return this.client.Runtime.evaluate({
    expression: `document.querySelector(\`${selector}\`).click()`
  });
};

exports.screenshot = function(filename) {
  checkDoffy(this);
  filename = filename || `screenshot-${Date.now()}.${this.options.screenshotFormat}`;
  return new Promise(async(resolve, reject) => {
    if(!/(\.png$)|(\.jpe?g$)/.test(filename)) {
      reject(new Error('screenshot should be file of png/jpg/jpeg'));
    }
    this.client.Page.captureScreenshot({
      format: this.options.screenshotFormat,
      quality: this.options.screenshotQuality,  // jpeg only
      fromSurface: true  // fromSurface is MUST on Mac
    }).then((img) => {
      fs.writeFile(filename, img.data, 'base64',
        (err) => {
          !!err && reject(err);
          resolve(true);
        }
      );
    }).catch(reject);
  });
};

exports.exist = function exist(selector) {
  return this.evaluate(selector => !!document.querySelector(selector), selector);
};

exports.visible = function visible(selector) {
  return this.evaluate((selector) => {
    const el = document.querySelector(selector);
    let style;
    try {
      style = window.getComputedStyle(el, null);
    } catch(e) {
      return false;
    }
    if(style.visibility === 'hidden' || style.display === 'none') {
      return false;
    }
    if(style.display === 'inline' || style.display === 'inline-block') {
      return true;
    }
    return el.clientHeight > 0 && el.clientWidth > 0;
  }, selector);
};

exports.wait = function wait(param, opt) {
  checkDoffy(this);
  opt = opt || {};
  if(typeof param === 'number') {
    return util.sleep(param);
  }
  if(typeof param === 'string') {
    return waitEl.call(this, param, opt);
  }
  if(typeof param === 'function') {
    return waitFn.call(this, param, opt);
  }
};

/**
 * poll until given selector exist or visible in waitTimeout.
 *
 * Options:
 * - type:  "exist", "visible", "hide",  (default: "exist")
 * - timeout:  wait timeout(ms) (default: "Doffy.options.waitTimeout")
 *
 * @param  String  selector  A DOM CSS3 compatible selector
 * @param  Object  opt   Options
 * @return Promise
 */
function waitEl(selector, opt) {
  opt = Object.assign({ type: 'exist' }, opt);
  switch(opt.type) {
    case 'visible':
      return waitFn.call(this, () => this.visible(selector), opt);
    /* case 'hide':
     return waitFn.call(this, () => this.visible(selector), opt); */
    default:
      return waitFn.call(this, () => this.exist(selector), opt);
  }
}

/**
 * poll until function return true in waitTimeout.
 *
 * Options:
 * - timeout:  wait timeout(ms) (default: "Doffy.options.waitTimeout")
 *
 * @param  Function   fn    function which be executed in polling
 * @param  Object     opt   Options
 * @return Promise
 */
function waitFn(fn, opt) {
  opt = opt || {};
  const waitTimeout = opt.timeout || this.options.waitTimeout;
  const self = this;
  let executionTimer;

  return new Promise((resolve, reject) => {
    // 整体超时
    const timeoutTimer = setTimeout(() => {
      clearTimeout(executionTimer);
      // done(new Error(`.wait() timed out after ${self.options.waitTimeout}ms`));
      console.error(`.wait() timed out after ${waitTimeout}ms`);
      reject(new Error(`.wait() timed out after ${waitTimeout}ms`));
    }, waitTimeout);

    tick(fn);

    // 定时轮循
    async function tick(fn) {
      let result;
      try {
        result = fn.call(self);
      } catch(err) {
        clearTimeout(timeoutTimer);
        console.error('execute wait method fail: ', err);
        reject(new Error('execute wait method fail', err));
      }
      if(result instanceof Promise) {
        result.then((ret) => {
          if(ret && ret.result) {
            handle(!!ret.result.value);
          } else {
            reject(new Error('wait promise must resolve object like {result: {type: \'boolean\', value: true}}'));
          }
        }).catch(reject);
      } else {
        handle(!!result);
      }
    }

    function handle(res) {
      if(res) {
        clearTimeout(timeoutTimer);
        resolve(true);
      } else {
        executionTimer = setTimeout(() => {
          tick(fn);
        }, self.options.pollInterval);
      }
    }
  });
}

function waitHttp() {

}

exports.fill = function(selector, value, opt) {
  opt = opt || {};
  if(opt.type === 'file') {
    const files = path.isAbsolute(value) ? value : path.resolve(__dirname, value);
    return new Promise(async(resolve, reject) => {
      try {
        const node = await this.querySelector(selector);
        const ret = await this.client.DOM.setFileInputFiles({
          nodeId: node.nodeId,
          files
        });
        resolve(ret);
      } catch(e) {
        reject(new Error(`can not set file path to ${selector}`, e));
      }
    });
  }
  return new Promise((resolve, reject) => {
    this.evaluate((selector, value) => {
      const el = document.querySelector(selector);
      const tag = el.nodeName.toLowerCase();
      const type = el.getAttribute('type');
      const supported = ['color', 'date', 'datetime', 'datetime-local',
        'email', 'hidden', 'month', 'number', 'password', 'range',
        'search', 'tel', 'text', 'time', 'url', 'week'];
      const isValidInput = tag === 'input' && (typeof type === 'undefined' || supported.indexOf(type) !== -1);
      const isTextArea = tag === 'textarea';
      if(isTextArea || isValidInput) {
        el.value = value;
      } else {
        reject(new Error(`DOM element ${selector} can not be filled`));
      }
    }, selector, value).then(resolve(true)).catch(reject);
  });
};

exports.querySelector = function(selector) {
  checkDoffy(this);
  const { DOM } = this.client;
  return new Promise(async(resolve, reject) => {
    try {
      const ret = await DOM.getDocument();
      const node = await DOM.querySelector({
        nodeId: ret.root.nodeId,
        selector
      });
      resolve(node);
    } catch(e) {
      reject(new Error(`can not query selector ${selector}`, e));
    }
  });
};

exports.setAttribute = function(selector, attr, value) {
  return new Promise(async(resolve, reject) => {
    try {
      const node = await this.querySelector(selector);
      const ret = await this.client.DOM.setAttributesAsText({
        nodeId: node.nodeId,
        name: attr,
        value
      });
      resolve(ret);
    } catch(e) {
      reject(new Error(`can not set ${attr} to ${selector}`, e));
    }
  });
};

exports.setNodeValue = function(selector, value) {
  return new Promise(async(resolve, reject) => {
    try {
      const node = await this.querySelector(selector);
      const ret = await this.client.DOM.setNodeValue({
        nodeId: node.nodeId,
        value
      });
      resolve(ret);
    } catch(e) {
      reject(new Error(`can not set node value to ${selector}`, e));
    }
  });
};

exports.focus = function(selector) {
  return new Promise(async(resolve, reject) => {
    try {
      const node = await this.querySelector(selector);
      const ret = await this.client.DOM.focus({ nodeId: node.nodeId });
      resolve(ret);
    } catch(e) {
      reject(new Error(`can not focus to ${selector}`, e));
    }
  });
};

/**
 * active, focus, hover, visited.
 */
exports.setPseudoClass = function(nodeId, cls) {
  checkDoffy(this);
  return this.client.CSS.forcePseudoState({
    nodeId,
    forcedPseudoClasses: cls
  });
};

exports.hover = function(selector) {
  return new Promise(async(resolve, reject) => {
    try {
      const node = await this.querySelector(selector);
      const ret = await this.setPseudoClass(node.nodeId, ['hover']);
      resolve(ret);
    } catch(e) {
      reject(new Error(`can not set :hover to ${selector}`, e));
    }
  });
};

exports.active = function(selector) {
  return new Promise(async(resolve, reject) => {
    try {
      const node = await this.querySelector(selector);
      const ret = await this.setPseudoClass(node.nodeId, ['active']);
      resolve(ret);
    } catch(e) {
      reject(new Error(`can not set :active to ${selector}`, e));
    }
  });
};

exports.visited = function(selector) {
  return new Promise(async(resolve, reject) => {
    try {
      const node = await this.querySelector(selector);
      const ret = await this.setPseudoClass(node.nodeId, ['visited']);
      resolve(ret);
    } catch(e) {
      reject(new Error(`can not set :visited to ${selector}`, e));
    }
  });
};
