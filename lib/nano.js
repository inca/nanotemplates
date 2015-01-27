"use strict";

var path = require('path')
  , subst = require('./subst');

var INCLUDE_REGEX = /<include\s+file=(['"])(.*?)\1\s*\/>/g;

var Nano = module.exports = exports = function(options) {

  this.basedir = options.basedir || process.cwd();

  this.load = typeof options.resolve == 'function' ?
    options.resolve : require('./loader').FileLoader(this.basedir);

};

Nano.prototype.localPath = function(relativeTo, file) {
  if (file.indexOf('/') == 0)
    return path.normalize(file);
  return path.normalize(path.join(path.dirname(relativeTo), file)).replace(/^\/+/, '');
};

Nano.prototype.render = function(file, done) {
  this._renderFile(file, {
    stack: [],
    rendered: {}
  }, done);
};

Nano.prototype._renderFile = function(file, ctx, done) {
  var nano = this;
  var parentFile = ctx.stack[ctx.stack.length - 1];
  if (parentFile) {
    // Included file or layout: resolve path relative to the caller
    file = nano.localPath(parentFile, file);
  } else {
    // Master file: forbid ../ at start
    file = path.normalize(file).replace(/^\.\.\//, '');
  }
  // See if file was already rendered in this job
  if (ctx.rendered[file])
    return done(null, ctx.rendered[file]);
  // Compile it
  ctx.stack.push(file);
  nano.load(file, function(err, content) {
    if (err) return done(err);
    nano._processIncludes(content, ctx, function(err, content) {
      if (err) return done(err);

      ctx.stack.pop();
      done(null, content);
    });
  });
};

Nano.prototype._processIncludes = function(content, ctx, done) {
  var nano = this;
  subst(content, INCLUDE_REGEX, function(cb, p0, p1, filename) {
    nano._renderFile(filename, ctx, cb);
  }, done);
};


