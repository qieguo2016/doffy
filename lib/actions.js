'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

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
  const exp = args && args.length > 0 ? `(${String(fn)}).apply(null, ${JSON.stringify(args)})` : `(${String(fn)}).apply(null)`;
  return this.client.Runtime.evaluate({
    expression: exp
  });
};

exports.goto = function (url, opt) {
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

exports.screenshot = function (filename) {
  var _this = this;

  checkDoffy(this);
  filename = filename || `screenshot-${Date.now()}.${this.options.screenshotFormat}`;
  return new Promise((() => {
    var _ref = _asyncToGenerator(function* (resolve, reject) {
      if (!/(\.png$)|(\.jpe?g$)/.test(filename)) {
        reject(new Error('screenshot should be file of png/jpg/jpeg'));
      }
      _this.client.Page.captureScreenshot({
        format: _this.options.screenshotFormat,
        quality: _this.options.screenshotQuality, // jpeg only
        fromSurface: true // fromSurface is MUST on Mac
      }).then(function (img) {
        fs.writeFile(filename, img.data, 'base64', function (err) {
          !!err && reject(err);
          resolve(true);
        });
      }).catch(reject);
    });

    return function (_x, _x2) {
      return _ref.apply(this, arguments);
    };
  })());
};

exports.exist = function exist(selector) {
  return this.evaluate(selector => !!document.querySelector(selector), selector);
};

exports.visible = function visible(selector) {
  return this.evaluate(selector => {
    const el = document.querySelector(selector);
    let style;
    try {
      style = window.getComputedStyle(el, null);
    } catch (e) {
      return false;
    }
    if (style.visibility === 'hidden' || style.display === 'none') {
      return false;
    }
    if (style.display === 'inline' || style.display === 'inline-block') {
      return true;
    }
    return el.clientHeight > 0 && el.clientWidth > 0;
  }, selector);
};

exports.wait = function wait(param, opt) {
  checkDoffy(this);
  opt = opt || {};
  if (typeof param === 'number') {
    return util.sleep(param);
  }
  if (typeof param === 'string') {
    return waitEl.call(this, param, opt);
  }
  if (typeof param === 'function') {
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
  switch (opt.type) {
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

    // 定时轮循
    let tick = (() => {
      var _ref2 = _asyncToGenerator(function* (fn) {
        let result;
        try {
          result = fn.call(self);
        } catch (err) {
          clearTimeout(timeoutTimer);
          console.error('execute wait method fail: ', err);
          reject(new Error('execute wait method fail', err));
        }
        if (result instanceof Promise) {
          result.then(function (ret) {
            if (ret && ret.result) {
              handle(!!ret.result.value);
            } else {
              reject(new Error('wait promise must resolve object like {result: {type: \'boolean\', value: true}}'));
            }
          }).catch(reject);
        } else {
          handle(!!result);
        }
      });

      return function tick(_x3) {
        return _ref2.apply(this, arguments);
      };
    })();

    // 整体超时
    const timeoutTimer = setTimeout(() => {
      clearTimeout(executionTimer);
      // done(new Error(`.wait() timed out after ${self.options.waitTimeout}ms`));
      console.error(`.wait() timed out after ${waitTimeout}ms`);
      reject(new Error(`.wait() timed out after ${waitTimeout}ms`));
    }, waitTimeout);

    tick(fn);

    function handle(res) {
      if (res) {
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

function waitHttp() {}

exports.fill = function (selector, value, opt) {
  var _this2 = this;

  opt = opt || {};
  if (opt.type === 'file') {
    const files = path.isAbsolute(value) ? value : path.resolve(__dirname, value);
    return new Promise((() => {
      var _ref3 = _asyncToGenerator(function* (resolve, reject) {
        try {
          const node = yield _this2.querySelector(selector);
          const ret = yield _this2.client.DOM.setFileInputFiles({
            nodeId: node.nodeId,
            files
          });
          resolve(ret);
        } catch (e) {
          reject(new Error(`can not set file path to ${selector}`, e));
        }
      });

      return function (_x4, _x5) {
        return _ref3.apply(this, arguments);
      };
    })());
  }
  return new Promise((resolve, reject) => {
    this.evaluate((selector, value) => {
      const el = document.querySelector(selector);
      const tag = el.nodeName.toLowerCase();
      const type = el.getAttribute('type');
      const supported = ['color', 'date', 'datetime', 'datetime-local', 'email', 'hidden', 'month', 'number', 'password', 'range', 'search', 'tel', 'text', 'time', 'url', 'week'];
      const isValidInput = tag === 'input' && (typeof type === 'undefined' || supported.indexOf(type) !== -1);
      const isTextArea = tag === 'textarea';
      if (isTextArea || isValidInput) {
        el.value = value;
      } else {
        reject(new Error(`DOM element ${selector} can not be filled`));
      }
    }, selector, value).then(resolve(true)).catch(reject);
  });
};

exports.querySelector = function (selector) {
  checkDoffy(this);
  const DOM = this.client.DOM;

  return new Promise((() => {
    var _ref4 = _asyncToGenerator(function* (resolve, reject) {
      try {
        const ret = yield DOM.getDocument();
        const node = yield DOM.querySelector({
          nodeId: ret.root.nodeId,
          selector
        });
        resolve(node);
      } catch (e) {
        reject(new Error(`can not query selector ${selector}`, e));
      }
    });

    return function (_x6, _x7) {
      return _ref4.apply(this, arguments);
    };
  })());
};

exports.setAttribute = function (selector, attr, value) {
  var _this3 = this;

  return new Promise((() => {
    var _ref5 = _asyncToGenerator(function* (resolve, reject) {
      try {
        const node = yield _this3.querySelector(selector);
        const ret = yield _this3.client.DOM.setAttributesAsText({
          nodeId: node.nodeId,
          name: attr,
          value
        });
        resolve(ret);
      } catch (e) {
        reject(new Error(`can not set ${attr} to ${selector}`, e));
      }
    });

    return function (_x8, _x9) {
      return _ref5.apply(this, arguments);
    };
  })());
};

exports.setNodeValue = function (selector, value) {
  var _this4 = this;

  return new Promise((() => {
    var _ref6 = _asyncToGenerator(function* (resolve, reject) {
      try {
        const node = yield _this4.querySelector(selector);
        const ret = yield _this4.client.DOM.setNodeValue({
          nodeId: node.nodeId,
          value
        });
        resolve(ret);
      } catch (e) {
        reject(new Error(`can not set node value to ${selector}`, e));
      }
    });

    return function (_x10, _x11) {
      return _ref6.apply(this, arguments);
    };
  })());
};

exports.focus = function (selector) {
  var _this5 = this;

  return new Promise((() => {
    var _ref7 = _asyncToGenerator(function* (resolve, reject) {
      try {
        const node = yield _this5.querySelector(selector);
        const ret = yield _this5.client.DOM.focus({ nodeId: node.nodeId });
        resolve(ret);
      } catch (e) {
        reject(new Error(`can not focus to ${selector}`, e));
      }
    });

    return function (_x12, _x13) {
      return _ref7.apply(this, arguments);
    };
  })());
};

/**
 * active, focus, hover, visited.
 */
exports.setPseudoClass = function (nodeId, cls) {
  checkDoffy(this);
  return this.client.CSS.forcePseudoState({
    nodeId,
    forcedPseudoClasses: cls
  });
};

exports.hover = function (selector) {
  var _this6 = this;

  return new Promise((() => {
    var _ref8 = _asyncToGenerator(function* (resolve, reject) {
      try {
        const node = yield _this6.querySelector(selector);
        const ret = yield _this6.setPseudoClass(node.nodeId, ['hover']);
        resolve(ret);
      } catch (e) {
        reject(new Error(`can not set :hover to ${selector}`, e));
      }
    });

    return function (_x14, _x15) {
      return _ref8.apply(this, arguments);
    };
  })());
};

exports.active = function (selector) {
  var _this7 = this;

  return new Promise((() => {
    var _ref9 = _asyncToGenerator(function* (resolve, reject) {
      try {
        const node = yield _this7.querySelector(selector);
        const ret = yield _this7.setPseudoClass(node.nodeId, ['active']);
        resolve(ret);
      } catch (e) {
        reject(new Error(`can not set :active to ${selector}`, e));
      }
    });

    return function (_x16, _x17) {
      return _ref9.apply(this, arguments);
    };
  })());
};

exports.visited = function (selector) {
  var _this8 = this;

  return new Promise((() => {
    var _ref10 = _asyncToGenerator(function* (resolve, reject) {
      try {
        const node = yield _this8.querySelector(selector);
        const ret = yield _this8.setPseudoClass(node.nodeId, ['visited']);
        resolve(ret);
      } catch (e) {
        reject(new Error(`can not set :visited to ${selector}`, e));
      }
    });

    return function (_x18, _x19) {
      return _ref10.apply(this, arguments);
    };
  })());
};