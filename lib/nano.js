"use strict";

var path = require('path')
  , async = require('async')
  , jsep = require('jsep')
  , Parser = require('./parser');

var Nano = module.exports = exports = function(options) {

  this.basedir = options.basedir || process.cwd();

  this.load = typeof options.load == 'function' ?
    options.load : require('./loader').FileLoader(this.basedir);

};

Nano.prototype.render = function(file, data, done) {
  if (typeof data == 'function') {
    done = data;
    data = {};
  }
  this._processFile(file, {
    file: file,
    cache: {},
    data: data,
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
    if (node.type == 'def')
      return nano._processDef(node, ctx, cb);
    if (node.type == 'block')
      return nano._processBlock(node, ctx, cb);
    if (node.type == 'expr')
      return nano._processExpr(node, ctx, cb);
    // Unknown node
    cb(null, '')
  }, function(err, results) {
    if (err) return done(err);
    done(null, results.join(''));
  });
};

Nano.prototype._processDef = function(node, ctx, done) {
  var nano = this;
  nano._processNodes(node.nodes, ctx, function(err, html) {
    if (err) return done(err);
    ctx.defs[node.name] = {
      mode: node.mode,
      html: html
    };
    done(null, '');
  });
};

Nano.prototype._processInclude = function(node, ctx, done) {
  ctx = {
    parent: ctx,
    file: localPath(ctx.file, node.file),
    defs: {},
    data: copyObject({}, ctx.data),
    cache: {}
  };
  var nano = this;
  async.eachSeries(node.defs, function(node, cb) {
    nano._processDef(node, ctx, cb);
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

Nano.prototype._processExpr = function(node, ctx, done) {
  var data = copyObject({}, ctx.data);
  try {
    var tree = jsep(node.expr);
    findIdentifiers(tree).forEach(function(key) {
      data[key] = data[key] || null;
    });
    var fn = new Function('data', 'with (data) { return ' + node.expr + ' }');
    var value = fn(data);
    done(null, node.escape ? escapeHtml(value) : value);
  } catch (e) {
    return done(e)
  }
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

function findIdentifiers(node) {
  if (node.type == 'Identifier')
    return [node.name];
  var result = [];
  Object.keys(node).forEach(function(key) {
    if (key == 'type') return;
    var value = node[key];
    if (typeof value == 'object')
      [].push.apply(result, findIdentifiers(value));
  });
  return result;
}

function copyObject(dst, src) {
  src = src || {};
  Object.keys(src).forEach(function(key) {
    dst[key] = src[key];
  });
  return dst;
}

function escapeHtml(html){
  return String(html)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
