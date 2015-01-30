var $$ = context.expressions;

var out = [];

var nano = {
  copy: function(to, from) {
    Object.keys(from).forEach(function(key) {
      to[key] = from[key]
    });
    return to;
  },
  escape: function(html) {
    return String(html)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
};
