"use strict";

var fallback = require('fallback');

/**
 * Tries each loader in `loaders` list, falling to the next one on error.
 */
module.exports = function(loaders) {

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
