"use strict";

var Nano = require('../lib/nano')
  , fs = require('fs')
  , assert = require('assert');

function assertHtml(actual, expected) {
  actual = actual.replace(/\s+</g, '<').replace(/>\s+/g, '>');
  expected = expected.replace(/\s+</g, '<').replace(/>\s+/g, '>');
  assert.equal(actual, expected);
}

describe('Nano', function() {

  var nano = new Nano({
    basedir: __dirname + '/templates'
  });

  it('should process simple includes', function(done) {

    nano.render('simpleIncludes/index.html', function(err, html) {
      if (err) return done(err);
      fs.readFile(__dirname + '/templates/simpleIncludes/_result.html', 'utf-8',
        function(err, expected) {
          if (err) return next(err);
          assertHtml(html, expected);
          done();
        });
    });

  });

});
