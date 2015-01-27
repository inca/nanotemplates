"use strict";

var fs = require('fs')
  , path = require('path');

exports.FileLoader = function(basedir) {

  return function(file, done) {
    var fullPath = path.resolve(path.join(basedir, file));
    var basedirPath = path.resolve(basedir);
    if (fullPath.indexOf(basedirPath) != 0)
      return done(new Error(file + ' is outside basedir ' + basedir));
    fs.readFile(fullPath, 'utf-8', done);
  }

};
