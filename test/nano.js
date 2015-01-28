"use strict";

var Nano = require('../lib/nano')
  , fs = require('fs')
  , path = require('path')
  , assert = require('assert');

function assertHtml(actual, expected) {
  actual = actual.replace(/\s+</g, '<').replace(/>\s+/g, '>');
  expected = expected.replace(/\s+</g, '<').replace(/>\s+/g, '>');
  assert.equal(actual, expected);
}

function assertHtmlFile(actual, expectedFile, cb) {
  fs.readFile(path.join(__dirname, 'templates', expectedFile), 'utf-8',
    function(err, expected) {
      if (err) return cb(err);
      assertHtml(actual, expected);
      cb();
    });
}

describe('Nano', function() {

  var nano = new Nano({
    basedir: __dirname + '/templates'
  });

  it('should process simple includes', function(done) {

    nano.render('simpleIncludes/index.html', function(err, html) {
      if (err) return done(err);
      assertHtmlFile(html, 'simpleIncludes/_index.html', done);
    });

  });

  it('should process simple layouts', function(done) {

    nano.render('layouts/index.html', function(err, html) {
      if (err) return done(err);
      assertHtmlFile(html, 'layouts/_index.html', done);
    });

  });

  it('should process layouts with block redifinition', function(done) {

    nano.render('layouts/users/list.html', function(err, html) {
      if (err) return done(err);
      assertHtmlFile(html, 'layouts/users/_list.html', done);
    });

  });

});
