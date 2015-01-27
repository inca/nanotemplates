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

  it('should process includes', function(cb) {
    nano.render('includes/index.html', function(err, html) {
      if (err) return cb(err);
      fs.readFile(__dirname + '/templates/includes/result.html', 'utf-8', function(err, expected) {
        if (err) return cb(err);
        assertHtml(html, expected);
        cb();
      });
    })
  });

});
