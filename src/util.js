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
