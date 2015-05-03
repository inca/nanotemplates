"use strict";

/**
 * A module for exposing Nanotemplates to browser (Browserify).
 */
module.exports = exports = require('./nano');

exports.ScriptTagLoader = require('./loaders/script');
exports.FallbackLoader = require('./loaders/fallback');
