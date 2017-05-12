"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
/**
 * @authors     : qieguo
 * @date        : 2017/5/11
 * @description :
 */

const defaultOptions = {
  debug: false
};

class logger {
  constructor(options) {
    this.options = Object.assign(defaultOptions, options);
  }

  debug() {}

  log(...args) {
    if (this.options.debug) {
      console.log(...args);
    }
  }

  info() {}

  error(...args) {
    console.error(...args);
  }
}

exports.default = logger;