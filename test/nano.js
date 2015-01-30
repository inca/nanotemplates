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

    nano.render('includes/index.html', function(err, html) {
      if (err) return done(err);
      assertHtmlFile(html, 'includes/_index.html', done);
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

  it('should maintain def scopes', function(done) {

    nano.render('localdefs/index.html', function(err, html) {
      if (err) return done(err);
      assertHtmlFile(html, 'localdefs/_index.html', done);
    });

  });

  it('should execute expressions', function(done) {

    nano.render('expressions/index.html', function(err, html) {
      if (err) return done(err);
      assertHtmlFile(html, 'expressions/_index.html', done);
    });

  });

});
