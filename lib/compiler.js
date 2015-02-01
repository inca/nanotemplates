"use strict";

var path = require('path')
  , fs = require('fs')
  , async = require('async')
  , AngularExpressions = require('angular-expressions')
  , Parser = require('./parser')
  , lru = require('lru-cache')
  , loaders = require('./loaders');

var runtime = fs.readFileSync(path.join(__dirname, 'runtime.js'), 'utf-8');

/**
 * Templates compiler.
 *
 * Options are:
 *
 *   * `basedir` — a directory where all templates reside, defaults to `process.cwd()`.
 *     Makes sense only with standard template loader (see below).
 *
 *   * `load` — a `function(file, callback)` which returns template content.
 *     See `loaders.js` for more information on template loading.
 *
 *   * `cache` — whether to cache the results to speed things up,
 *     defaults to `true` in production environment (with `NODE_ENV == 'production'`)
 *     and to `false` otherwise. You can also specify an object with options
 *     understood by `lru-cache`.
 *
 */
var Compiler = module.exports = exports = function(options) {

  options = options || {};

  this.load = typeof options.load == 'function' ?
    options.load : loaders.FileLoader(options.basedir || process.cwd());

  this.caching = (options.cache == null) ?
    process.env.NODE_ENV == 'production' :
    options.cache;

  if (this.caching) {
    this.cache = lru(typeof this.caching == 'object' ? this.caching : {
      max: 1000,
      maxAge: 60000
    });
  }

};

Compiler.prototype.compile = function(file, done) {
  var compiler = this;
  file = path.normalize(file);
  var cached = compiler.cache && compiler.cache.get(file);
  if (cached)
    return done(null, cached);
  new Job(compiler, file).compile(function(err, fn) {
    if (err) return done(err);
    if (compiler.cache)
      compiler.cache.set(file, fn);
    return done(null, fn);
  });
};

/**
 * Unit of work of template compiler.
 *
 * Instances hold job-local stuff like AST cache, parsed expressions
 * and other magic. Instances must not be reused.
 */
var Job = exports.Job = function(compiler, file) {
  this.compiler = compiler;
  this.file = file;
  this.expressions = [];
  this.cachedNodes = {};
};

Job.prototype.load = function(file, done) {
  if (file.indexOf('../') == 0)
    return done(new Error(file + ' is outside basedir'));
  return this.compiler.load(file, done);
};

Job.prototype.compile = function(done) {
  var job = this;
  job._processFile(job.file, {
    file: job.file,
    defs: {}
  }, function(err, code) {
    if (err) return done(err);
    var fn = new Function('context', runtime +
        'return function(locals) {' +
        'var out = [];' +
        'locals = locals || {};' +
        code +
        ';return out.join("");' +
        '}'
    );
    done(null, fn({
      expressions: job.expressions
    }));
  });
};

Job.prototype._processFile = function(file, ctx, done) {
  var job = this;
  var parentFile = ctx.parent && ctx.parent.file;
  file = localPath(parentFile || '', file);
  // Check cache for parsed AST
  var cached = job.cachedNodes[file];
  if (cached)
    return job._processNodes(cached, ctx, done);
  // Load and parse template
  job.load(file, function(err, content) {
    if (err) return done(err);
    try {
      var nodes = Parser.parse(content);
      job.cachedNodes[file] = nodes;
      job._processNodes(nodes, ctx, done);
    } catch (e) {
      done(e);
    }
  });
};

Job.prototype._processNodes = function(nodes, ctx, done) {
  var job = this;
  async.mapSeries(nodes, function(node, cb) {
    if (typeof node == 'string')
      return job._process_plain(node, cb);
    return job['_process_' + node.type](node, ctx, cb);
  }, function(err, statements) {
    if (err) return done(err);
    done(null, statements.join(';'));
  });
};

Job.prototype._process_plain = function(text, done) {
  done(null, bufferText(text));
};

Job.prototype._process_def = function(node, ctx, done) {
  var job = this;
  job._processNodes(node.nodes, ctx, function(err, code) {
    if (err) return done(err);
    ctx.defs[node.name] = {
      mode: node.mode,
      code: code
    };
    done(null, []);
  });
};

Job.prototype._process_block = function(node, ctx, done) {
  var job = this;
  var def = findDefinition(node.name, ctx);
  job._processNodes(node.nodes, ctx, function(err, code) {
    if (err) return done(err);
    if (!def)
      return done(null, code);
    switch (def.mode) {
      case 'append':
        return done(null, [code, def.code].join(';'));
      case 'prepend':
        return done(null, [def.code].join(';'));
      default:
        return done(null, def.code);
    }
  });
};

Job.prototype._process_include = function(node, ctx, done) {
  ctx = {
    parent: ctx,
    file: localPath(ctx.file, node.file),
    defs: {}
  };
  var job = this;
  async.mapSeries(node.nodes, function(node, cb) {
    return job['_process_' + node.type](node, ctx, cb);
  }, function(err, statements) {
    if (err) return done(err);
    // Read included file
    job._processFile(node.file, ctx, function(err, code) {
      if (err) return done(err);
      // Join all statements
      code = statements.concat([code]).join(';');
      // Wrap statements into scoped context
      done(null, scoped(code));
    });
  });
};

Job.prototype._process_inline = function(node, ctx, done) {
  var job = this;
  var escaped = true;
  if (node.file.indexOf('!') == 0) {
    escaped = false;
    node.file = node.file.substring(1);
  }
  var file = localPath(ctx.file, node.file);
  // Load and parse template
  job.load(file, function(err, content) {
    if (err) return done(err);
    done(null, escaped ? bufferEscapedText(content) : bufferText(content));
  });
};

Job.prototype._process_expr = function(node, ctx, done) {
  var job = this;
  try {
    job.expressions.push(AngularExpressions.compile(node.expr));
    var index = job.expressions.length - 1;
    var st = null;
    if (node.buffer) {
      if (node.escape) {
        st = bufferEscaped('$$[' + index + '](locals)');
      } else {
        st = buffer('$$[' + index + '](locals)');
      }
    } else {
      st = '$$[' + index + '](locals)';
    }
    done(null, st);
  } catch (e) {
    return done(e)
  }
};

Job.prototype._process_var = function(node, ctx, done) {
  var job = this;
  try {
    job.expressions.push(AngularExpressions.compile(node.expr));
    var index = job.expressions.length - 1;
    done(null, 'locals.' + node.name + ' = $$[' + index + '](locals)');
  } catch (e) {
    return done(e)
  }
};

Job.prototype._process_if = function(node, ctx, done) {
  var job = this;
  async.mapSeries(node.when, function(when, cb) {
    try {
      job.expressions.push(AngularExpressions.compile(when.expr));
      var index = job.expressions.length - 1;
      var ifCap = 'if ($$[' + index  + '](locals))';
      job._processNodes(when.nodes, ctx, function(err, code) {
        if (err) return cb(err);
        cb(null, ifCap + '{' + code + '}');
      });
    } catch (e) {
      return done(e);
    }
  }, function(err, ifs) {
    if (err) return done(err);
    var statement = ifs.join(' else ');
    if (!node.otherwise)
      return done(null, scoped(statement));
    job._processNodes(node.otherwise.nodes, ctx, function(err, code) {
      if (err) return done(err);
      statement = statement + 'else {' + code + '}';
      done(null, scoped(statement));
    });
  });
};

Job.prototype._process_case = function(node, ctx, done) {
  var job = this;
  var statement = '';
  try {
    job.expressions.push(AngularExpressions.compile(node.expr));
    var index = job.expressions.length - 1;
    statement += 'locals.' + node.name + ' = $$[' + index + '](locals);';
  } catch (e) {
    return done(e);
  }
  async.mapSeries(node.when, function(when, cb) {
    try {
      var expr = AngularExpressions.compile(when.expr);
      job.expressions.push(expr);
      var index = job.expressions.length - 1;
      var ifCap = expr.constant ?
        'if (locals.' + node.name + ' == $$[' + index  + '](locals))' :
        'if ($$[' + index  + '](locals))';
      job._processNodes(when.nodes, ctx, function(err, code) {
        if (err) return cb(err);
        cb(null, ifCap + '{' + code + '}');
      });
    } catch (e) {
      return done(e);
    }
  }, function(err, ifs) {
    if (err) return done(err);
    statement += ifs.join(' else ');
    if (!node.otherwise)
      return done(null, scoped(statement));
    job._processNodes(node.otherwise.nodes, ctx, function(err, code) {
      if (err) return done(err);
      statement = statement + 'else {' + code + '}';
      done(null, scoped(statement));
    });
  });
};

Job.prototype._process_each = function(node, ctx, done) {
  var job = this;
  var statement = '';
  try {
    job.expressions.push(AngularExpressions.compile(node.expr));
    var index = job.expressions.length - 1;
    statement += 'each($$[' + index + '](locals),' +
      JSON.stringify(node.name) + ',' +
      'locals,' +
      'function(locals) {';
  } catch (e) {
    return done(e);
  }
  job._processNodes(node.nodes, ctx, function(err, code) {
    if (err) return done(err);
    statement += code + '})';
    done(null, scoped(statement));
  });
};

function localPath(relativeTo, file) {
  file = path.normalize(file);
  if (file.indexOf('/') == 0)
    return file.replace(/^\/+/, '');
  return path.normalize(path.join(path.dirname(relativeTo), file));
}

function findDefinition(name, ctx) {
  var def = ctx.defs[name];
  if (def)
    return def;
  return ctx.parent ? findDefinition(name, ctx.parent) : null;
}

function scoped(code) {
  return '(function(locals){' + code + '})(Object.create(locals))'
}

function bufferText(str) {
  return buffer(JSON.stringify(str));
}

function bufferEscapedText(str) {
  return bufferEscaped(JSON.stringify(str));
}

function bufferEscaped(code) {
  return buffer('escapeHtml(' + code + ')');
}

function buffer(code) {
  return 'out.push(' + code + ')';
}
