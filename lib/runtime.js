var $$ = context.expressions;

var globals = {
  encodeURI: encodeURI,
  encodeURIComponent: encodeURIComponent,
  Date: Date,
  Math: Math,
  JSON: JSON,
  Object: Object
};

function extend() {
  var argv = [].slice.call(arguments);
  return argv.reduce(function (result, current) {
    Object.keys(current).forEach(function (key) {
      result[key] = current[key];
    });
    return result;
  }, {});
}

function escapeHtml(html) {
  return String(html)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function each(obj, varName, locals, fn) {
  function it(v, k, arr) {
    locals[varName] = v;
    locals[varName + '_index'] =
      locals[varName + '_key'] =
        k;
    var isLast = typeof k == 'string' ?
      arr[arr.length - 1] == k : k == arr.length - 1;
    locals[varName + '_last'] = isLast;
    locals[varName + '_has_next'] = !isLast;
    fn(Object.create(locals));
  }
  if (obj == null)
    return;
  if (Array.isArray(obj))
    return obj.forEach(it);
  if (typeof obj == 'object') {
    var keys = Object.keys(obj).sort();
    return keys.forEach(function (k) {
      it(obj[k], k, keys);
    });
  }
  throw new Error('Non-iterable object ' + obj);
}
