"use strict";

var path = require('path')
  , async = require('async');

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
    stack: []
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
  ctx.stack.push(file);
  nano.load(file, function(err, content) {
    if (err) return done(err);
    ctx.content = content;
    nano._processIncludes(ctx, function(err, content) {
      if (err) return done(err);

      ctx.stack.pop();
      done(null, content);
    });
  });
};

Nano.prototype._processIncludes = function(ctx, done) {
  var nano = this;
  var queries = [
    function(cb) {
      cb(null, ctx.content);
    }
  ];
  ctx.content = ctx.content.replace(INCLUDE_REGEX, function(p0, p1, filename) {
    var hash = '###' + Math.random().toString(36) + '###';
    queries.push(function(content, cb) {
      nano._renderFile(filename, ctx, function(err, included) {
        if (err) return cb(err);
        cb(null, content.replace(hash, included));
      });
    });
    return hash;
  });
  async.waterfall(queries, done);
};


