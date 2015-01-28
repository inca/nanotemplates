"use strict";

var path = require('path')
  , async = require('async')
  , Parser = require('./parser');

var Nano = module.exports = exports = function(options) {

  this.basedir = options.basedir || process.cwd();

  this.load = typeof options.load == 'function' ?
    options.load : require('./loader').FileLoader(this.basedir);

};

function localPath(relativeTo, file) {
  file = path.normalize(file);
  if (file.indexOf('/') == 0)
    return file.replace(/^\/+/, '');
  return path.normalize(path.join(path.dirname(relativeTo), file))
    .replace(/^\.{0,2}\/+/, '');
}

function findCachedNodes(file, ctx) {
  var cached = ctx.cache[file];
  if (cached)
    return cached;
  return ctx.parent ? findCachedNodes(file, ctx.parent) : null;
}

function findDefinition(name, ctx) {
  var def = ctx.defs[name];
  if (def)
    return def;
  return ctx.parent ? findDefinition(name, ctx.parent) : null;
}

Nano.prototype.render = function(file, done) {
  this._processFile(file, {
    file: file,
    cache: {},
    defs: {}
  }, done);
};

Nano.prototype._processFile = function(file, ctx, done) {
  var nano = this;
  var parentFile = ctx.parent && ctx.parent.file;
  file = localPath(parentFile || '', file);
  // Check cache for parsed AST
  var cached = findCachedNodes(file, ctx);
  if (cached)
    return nano._processNodes(cached, ctx, done);
  // Load and parse template
  nano.load(file, function(err, content) {
    if (err) return done(err);
    try {
      var nodes = Parser.parse(content);
      ctx.cache[file] = nodes;
      nano._processNodes(nodes, ctx, function(err, html) {
        if (err) return done(err);
        done(null, html);
      });
    } catch (e) {
      done(e);
    }
  });
};

Nano.prototype._processNodes = function(nodes, ctx, done) {
  var nano = this;
  async.mapSeries(nodes, function(node, cb) {
    if (typeof node == 'string')
      return cb(null, node);
    if (node.type == 'include')
      return nano._processInclude(node, ctx, cb);
    if (node.type == 'block')
      return nano._processBlock(node, ctx, cb);
    // Unknown node
    cb(null, '')
  }, function(err, results) {
    if (err) return done(err);
    done(null, results.join(''));
  });
};

Nano.prototype._processInclude = function(node, ctx, done) {
  ctx = {
    parent: ctx,
    file: localPath(ctx.file, node.file),
    defs: {},
    cache: {}
  };
  var nano = this;
  async.eachSeries(node.defs, function(def, cb) {
    nano._processNodes(def.nodes, ctx, function(err, html) {
      if (err) return cb(err);
      ctx.defs[def.name] = {
        mode: def.mode,
        html: html
      };
      cb();
    });
  }, function(err) {
    if (err) return done(err);
    // Read included file
    nano._processFile(node.file, ctx, done);
  });
};

Nano.prototype._processBlock = function(node, ctx, done) {
  var nano = this;
  var def = findDefinition(node.name, ctx);
  nano._processNodes(node.nodes, ctx, function(err, html) {
    if (err) return done(err);
    if (!def)
      return done(null, html);
    switch (def.mode) {
      case 'append':
        return done(null, html + def.html);
      case 'prepend':
        return done(null, def.html + html);
      default:
        return done(null, def.html);
    }
  });
};


