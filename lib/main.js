"use strict";

/**
 * A main module for exposing Nanotemplates to Node.js.
 */
module.exports = exports = require('./nano');

exports.bundle = require('./bundle');
exports.FileLoader = require('./loaders/fs');
exports.FallbackLoader = require('./loaders/fallback');
exports.ScriptTagLoader = require('./loaders/script');
