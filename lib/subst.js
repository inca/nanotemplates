"use strict";

var async = require('async');

/**
 * Performs asynchronous replace of `regex` in specified `str` with
 * `replacer` being a function executed on each successful match.
 *
 * Replacer function gets following arguments:
 *
 *   * cb — callback function
 *   * p0 — matched substring
 *   * p1 .. pN — captured groups
 *
 * A callback function must be invoked with a replacement string.
 *
 * Example:
 *
 * ```
 * subst('foo', /f(o)(o)/g, function(cb, foo, firstO, secondO) {
 *   cb(null, 'hello-' + firstO + secondO);
 * }, done);
 * ```
 *
 * In this example `done` receives (null, 'hello-oo')
 *
 */
module.exports = exports = function(str, regex, replacer, done) {
  var queries = [];
  var hashed = str.replace(regex, function() {
    var args = [].slice.call(arguments);
    var hash = '#!{' + Math.random().toString(36) + '}!#';
    queries.push(function(str, cb) {
      args.unshift(function(err, replacement) {
        if (err) return cb(err);
        cb(null, str.replace(hash, replacement));
      });
      replacer.apply(str, args);
    });
    return hash;
  });
  queries.unshift(function(cb) {
    cb(null, hashed);
  });
  async.waterfall(queries, done);
};
