'use strict';

var path = require('path')
  , lru = require('lru-cache')
  , Job = require('./job');

/**
 * Templates compiler.
 *
 * Options are:
 *
 *   * `basedir` — a directory where all templates reside, defaults to `process.cwd()`.
 *     Makes sense only with standard template loader (see below).
 *
 *   * `load` — a `function (file, callback)` which returns template content.
 *     See `loaders.js` for more information on template loading.
 *
 *   * `cache` — whether to cache the results to speed things up,
 *     defaults to `true` in production environment (with `NODE_ENV == 'production'`)
 *     and to `false` otherwise. You can also specify an object with options
 *     understood by `lru-cache`.
 *
 *   * `stripComments` — remove comments at compile time, thus speeding up
 *     cache-based rendering.
 *
 */
var Compiler = module.exports = exports = function (options) {

  options = options || {};

  this.load = typeof options.load == 'function' ? options.load :
    (typeof window == 'undefined' ?
      require('./loaders/fs')(options.basedir || process.cwd()) :
      require('./loaders/script')());

  this.caching = (options.cache == null) ?
    process.env.NODE_ENV == 'production' :
    options.cache;

  this.stripComments = options.stripComments || false;

  if (this.caching) {
    this.cache = lru(typeof this.caching == 'object' ? this.caching : {
      max: 1000,
      maxAge: 600000
    });
  }

};

Compiler.prototype.compile = function (file, done) {
  var compiler = this;
  file = path.normalize(file);
  var cached = compiler.cache && compiler.cache.get(file);
  if (cached)
    return done(null, cached);
  new Job(compiler, file).compile(function (err, fn) {
    if (err) return done(err);
    if (compiler.cache)
      compiler.cache.set(file, fn);
    return done(null, fn);
  });
};

