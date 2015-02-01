"use strict";

var fs = require('fs')
  , path = require('path')
  , fallback = require('fallback');

/**
 * Nanotemplates provides a simple mechanism to load templates from virtually
 * any source (file system, database, network, etc.).
 *
 * The whole idea is based on so-called "local paths":
 *
 *   * when you invoke `compiler.compile('some_dir/another_dir/file')`
 *     the directory where `some_dir` resides becomes virtual root directory;
 *
 *   * all paths inside templates (e.g. in includes or inlines) are converted by compiler
 *     into "local paths", which are always relative this virtual root directory;
 *
 *   * compiler takes care to forbid paths that "leak" outside this virtual root.
 *
 * Template loader is simply a `function(localPath, callback)`,
 * which loads template content and invokes `callback(err, content)`.
 *
 * We provide a file system loader since it is the most common use case.
 * It is fairly simple to implement a new one (e.g. load templates from MongoDB or Redis).
 */

/**
 * Returns a file-based template loader.
 *
 * `basedir` must point to directory where all templates reside.
 */
exports.FileLoader = function(basedir) {

  return function(file, done) {
    var fullPath = path.resolve(path.join(basedir, file));
    var basedirPath = path.resolve(basedir);
    if (fullPath.indexOf(basedirPath) != 0)
      return done(new Error(file + ' is outside basedir'));
    fs.readFile(fullPath, 'utf-8', done);
  }

};

/**
 * Tries each loader in `loaders` list, falling to the next one on error.
 */
exports.FallbackLoader = function(loaders) {

  return function(file, done) {
    fallback(loaders, function(loader, cb) {
      loader(file, function(err, content) {
        if (err) return cb(); // try next one
        cb(null, content);
      })
    }, function(err, content) {
      if (err) return done(err);
      if (content) return done(null, content);
      done(new Error('Template ' + file + ' not found.'));
    });
  }

};
