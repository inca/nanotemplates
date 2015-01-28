"use strict";

var path = require('path');

var Nano = module.exports = exports = function(options) {

  this.basedir = options.basedir || process.cwd();

  this.load = typeof options.load == 'function' ?
    options.load : require('./loader').FileLoader(this.basedir);

};

Nano.prototype.localPath = function(relativeTo, file) {
  if (file.indexOf('/') == 0)
    return path.normalize(file);
  return path.normalize(path.join(path.dirname(relativeTo), file)).replace(/^\/+/, '');
};

Nano.prototype.render = function(file, done) {
  done();
};
