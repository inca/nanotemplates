"use strict";

var Parser = require('./parser')
  , Compiler = require('./compiler')
  , loaders = require('./loaders');

var Nano = module.exports = exports = function(options) {
  options = options || {};
  this.compiler = options.compiler || new Compiler(options);
};

Nano.prototype.compile = function(file, done) {
  this.compiler.compile(file, done);
};

Nano.prototype.render = function(file, data, done) {
  if (typeof(data) == 'function') {
    done = data;
    data = {};
  }
  this.compile(file, function(err, fn) {
    if (err) return done(err);
    done(null, fn(data));
  });
};

// Expose parser, compiler and loaders

exports.Parser = Parser;
exports.Compiler = Compiler;

Object.keys(loaders).forEach(function(key) {
  exports[key] = loaders[key];
});
