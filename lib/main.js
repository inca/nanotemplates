'use strict';

/**
 * A main module for exposing Nanotemplates to Node.js.
 */
module.exports = exports = require('./nano');

exports.bundle = require('./bundle');
exports.fileLoader = require('./loaders/fs');
exports.fallbackLoader = require('./loaders/fallback');
exports.scriptTagLoader = require('./loaders/script');
