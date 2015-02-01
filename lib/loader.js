"use strict";

var fs = require('fs')
  , path = require('path')
  , async = require('async');

exports.FileLoader = function(basedir) {

  return function(file, done) {
    var fullPath = path.resolve(path.join(basedir, file));
    var basedirPath = path.resolve(basedir);
    if (fullPath.indexOf(basedirPath) != 0)
      return done(new Error(file + ' is outside basedir ' + basedir));
    async.parallel([
      function(cb) {
        fs.readFile(fullPath, 'utf-8', cb)
      },
      function(cb) {
        fs.stat(fullPath, function(err, stat) {
          if (err) return cb(err);
          cb(null, stat.mtime.getTime());
        });
      }
    ], function(err, results) {
      if (err) return done(err);
      done(null, results[0], results[1]);
    });
  }

};
