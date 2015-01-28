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

});
