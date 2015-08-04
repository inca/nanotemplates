'use strict';

/**
 * A module for exposing Nanotemplates to browser (Browserify).
 */
module.exports = exports = require('./nano');

exports.scriptTagLoader = require('./loaders/script');
exports.fallbackLoader = require('./loaders/fallback');
