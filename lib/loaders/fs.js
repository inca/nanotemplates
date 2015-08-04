'use strict';

var path = require('path');

var fs = require('fs');   // brfs bug: do not merge with other vars!

/**
 * Returns a file-based template loader.
 *
 * `basedir` must point to directory where all templates reside.
 */
module.exports = function (basedir) {

  return function (file, done) {
    var fullPath = path.resolve(path.join(basedir, file));
    var basedirPath = path.resolve(basedir);
    if (fullPath.indexOf(basedirPath) != 0)
      return done(new Error(file + ' is outside basedir'));
    fs.readFile(fullPath, 'utf-8', done);
  };
};
