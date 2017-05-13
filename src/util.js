/**
 * @authors     : qieguo
 * @date        : 2017/5/7
 * @description :
 */

exports.checkDoffy = function checkDoffy(doffy) {
  if(!doffy.client) {
    console.error('doffy is not ready, please call doffy.init() at first!');
    process.exit(1);
  }
};

exports.concatPromise = function concatPromise(promise, fn, ctx) {
  return new Promise((resolve, reject) => {
    promise.then((...ret) => resolve(fn.apply(ctx, ...ret)))
           .catch(reject);
  });
};

exports.bindMethods = function(methods, obj) {
  methods.forEach((method) => {
    if(typeof obj[method] === 'function') {
      obj[method] = obj[method].bind(obj);
    }
  });
};

exports.sleep = function(time) {
  return new Promise(resolve => setTimeout(resolve, time));
};

exports.Quene = class {
  constructor(len) {
    this.quene = [];
    this._maxLength = len;
  }

  put(el) {
    this.quene.push(el);
    if(this.quene.length > this._maxLength) {
      return this.quene.shift();
    }
    return el;
  }

  get() {
    return this.quene.shift();
  }

  get length() {
    return this.quene.length;
  }

}
