"use strict";

/**
 * Loads a template from script tag with `type="text/html"` when Nanotemplates
 * are used in client side application (via Browserify).
 *
 * A selector is a CSS selector which is passed to `document.querySelector`
 * to locate the element; `%s` in selector is replaced with template filename.
 *
 * The default selector `[id="%s"]` locates script tags with their
 * ID attribute containing template filename.
 *
 * Tip: to bundle client templates into server-rendered Nanotemplates pages
 * you can use `<inline src="path/to/client/template"/>` to bypass parsing
 * client templates; or use server-side helpers to load files and expose them
 * as runtime template data. See `lib/bundle.js` which does exactly that.
 */
module.exports = function(selector) {

  selector = selector || '[id="%s"]';

  return function(file, done) {
    selector = selector.replace('%s', file);
    var elem = document.querySelector('script[type="text/html"]' + selector);
    if (!elem)
      return done(new Error('Template ' + file) + ' not found.');
    done(null, elem.innerHTML);
  }

};
