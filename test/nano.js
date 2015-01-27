"use strict";

var Nano = require('../lib/nano')
  , assert = require('assert');

describe('Nano', function() {

  var nano = new Nano({
    basedir: __dirname + '/templates'
  });

  it('should process includes', function(cb) {
    nano.render('includes/index.html', function(err, html) {
      if (err) return cb(err);
      console.log(html);
      cb();
    })
  });

});
