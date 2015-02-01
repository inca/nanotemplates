"use strict";

var Nano = require('../lib/nano')
  , loaders = require('../lib/loaders')
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

describe('Nanotemplates', function() {

  var nano = new Nano({
    basedir: __dirname + '/templates'
  });

  var users = [
    { name: 'Alice' },
    { name: 'Joe' },
    { name: 'Jane' }
  ];

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

  it('should process vars with respect to scopes', function(done) {

    nano.render('vars/index.html', function(err, html) {
      if (err) return done(err);
      assertHtmlFile(html, 'vars/_index.html', done);
    });

  });

  it('should process inlines', function(done) {

    nano.render('inlines/index.html', function(err, html) {
      if (err) return done(err);
      assertHtmlFile(html, 'inlines/_index.html', done);
    });

  });

  it('should process if statements without locals', function(done) {

    nano.render('if/index.html', function(err, html) {
      if (err) return done(err);
      assertHtmlFile(html, 'if/_undefined.html', done);
    });

  });

  it('should process if when statements', function(done) {

    nano.render('if/index.html', { friends: 2 }, function(err, html) {
      if (err) return done(err);
      assertHtmlFile(html, 'if/_2.html', done);
    });

  });

  it('should process if otherwise statements', function(done) {

    nano.render('if/index.html', { friends: 100500 }, function(err, html) {
      if (err) return done(err);
      assertHtmlFile(html, 'if/_100500.html', done);
    });

  });

  it('should process case statements without locals', function(done) {

    nano.render('case/index.html', function(err, html) {
      if (err) return done(err);
      assertHtmlFile(html, 'case/_undefined.html', done);
    });

  });

  it('should process case when constants', function(done) {

    nano.render('case/index.html', { friends: 1 }, function(err, html) {
      if (err) return done(err);
      assertHtmlFile(html, 'case/_1.html', done);
    });

  });

  it('should process case when expressions', function(done) {

    nano.render('case/index.html', { friends: 2 }, function(err, html) {
      if (err) return done(err);
      assertHtmlFile(html, 'case/_2.html', done);
    });

  });

  it('should process case otherwise statements', function(done) {

    nano.render('if/index.html', { friends: 100500 }, function(err, html) {
      if (err) return done(err);
      assertHtmlFile(html, 'case/_100500.html', done);
    });

  });

  it('should process each statements with arrays', function(done) {

    nano.render('each/index.html', { users: users }, function(err, html) {
      if (err) return done(err);
      assertHtmlFile(html, 'each/_array.html', done);
    });

  });

  it('should process each statements with objects', function(done) {

    nano.render('each/index.html',
      { users: { alice: 'Alice', bob: 'Bob' } },
      function(err, html) {
        if (err) return done(err);
        assertHtmlFile(html, 'each/_object.html', done);
      });

  });

});

describe('FileLoader', function() {

  var nano = new Nano({
    basedir: __dirname + '/templates'
  });

  it('should reject paths that start with ../', function(done) {
    nano.render('./dir/../../nano.js', function(err) {
      if (err) return done();
      done(new Error('WTF?'));
    });
  });

});

describe('FallbackLoader', function() {

  var nano = new Nano({
    load: loaders.FallbackLoader([
      loaders.FileLoader(__dirname + '/nonsense'),
      loaders.FileLoader(__dirname + '/templates/fallback'),
      loaders.FileLoader(__dirname + '/templates')
    ])
  });

  it('should try all loaders in list, ignoring errors', function(done) {
    nano.render('fallback/index.html', function(err, html) {
      if (err) return done(err);
      assertHtml(html, '<p>I win!</p>');
      done();
    })
  });

  it('should load templates with higher priorities', function(done) {
    nano.render('inlines/index.html', function(err, html) {
      if (err) return done(err);
      assertHtml(html, '<p>I win, too!</p>');
      done();
    })
  });

  it('should throw errors when not found', function(done) {
    nano.render('nonsense/index.html', function(err) {
      if (err) return done();
      done(new Error('WTF?'));
    })
  });

});
