"use strict";

var glob = require('glob')
  , fs = require('fs')
  , path = require('path')
  , async = require('async');

/**
 * Server-side utility for scanning directory `cwd`
 * for files matching glob `pattern`, reading the files
 * and returning them as `{ path: 'some/file.html', content: 'Content' }`
 * with each `path` being relative to `cwd`.
 *
 * You can use it on server to bundle the client-side templates:
 *
 * ```
 * var Nano = require('nanotemplates');
 *
 * Nano.bundle('views/client', '*.html', function(err, templates) {
 *   if (err) { ... }
 *   res.render('server/page.html', {
 *     templates: templates
 *   });
 * });
 * ```
 *
 * And in `server/page.html` you can expose loaded templates using script tags:
 *
 * ```
 * <each:template in="templates">
 *   <script id="#{template.path}">!{template.content}</script>
 * </each>
 * ```
 */
module.exports = exports = function(cwd, pattern, cb) {
  glob(pattern, {
    cwd: cwd,
    nodir: true
  }, function(err, files) {
    if (err) return cb(err);
    async.map(files, function(file, cb) {
      fs.readFile(path.join(cwd, file), 'utf-8', function(err, content) {
        if (err) return cb(err);
        cb(null, {
          path: file,
          content: content
        });
      });
    }, cb);
  });
};
