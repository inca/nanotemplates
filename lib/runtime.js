var $$ = context.expressions;

function escapeHtml(html) {
  return String(html)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function each(obj, varName, locals, fn) {
  function it(v, k) {
    locals[varName] = v;
    locals[varName + '_index'] =
      locals[varName + '_key'] =
        k;
    fn(Object.create(locals));
  }
  if (obj == null)
    return;
  if (Array.isArray(obj))
    return obj.forEach(it);
  if (typeof obj == 'object')
    return Object.keys(obj).sort().forEach(function(k) {
      it(obj[k], k);
    });
  throw new Error('Non-iterable object ' + obj);
}
