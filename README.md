# Nanotemplates

Miniature framework for composing static HTML pages.

Key features:

  * **safety** — runtime is done via Angular expressions engine (which is considered safe),

  * **intuitive** — extremely simple

  * **IDE-friendly** — templates are based on custom HTML tags, so you don't have
    to install code highlighters

## Usage

```
// Configure renderer instance
var nano = require('nanotemplates')({
  basedir: 'templates/directory'
});

// Render file
nano.render('path/to/template.html', function(err, html) {
  // ...
});
``

Templates are resolved relatively to `basedir`. Paths inside include tags are
relative to their call site (e.g. including `../layout.html` from
`templates/users/index.html` will include `templates/layout.html`).

Referencing templates outside `basedir` is not allowed.

## Nanotemplate Syntax

Note: examples below are written in HTML, but you can use Nanotemplates
to render any file type. Remember, Nanotemplates only recognize a small subset
of tags and do not care about anything else.

### Includes

Content fragments can be extracted into separate files and then reused via
`<include file="path/to/fragment"/>`.

#### Example

index.html:

```
<!doctype html>
<html>
  <head>
  </head>
  <body>
    <include file='header.html'/>
    <h1>Content</h1>
  </body>
</html>
```

header.html:

```
<header>Hello World!</header>
```

Rendered index.html:

```
<!doctype html>
<html>
  <head>
  </head>
  <body>
    <header>Hello World!</header>
    <h1>Content</h1>
  </body>
</html>
```

### Layouts, blocks, definitions

Layouts are top-level markup files with places (blocks) reserved for actual content.

Blocks can be declared anywhere using `<block:block_name>` tag, they can also contain
arbitrary default content.

Concrete pages can provide block definitions using `<def:block_name>` inside
`<include>` tags. Each definition is local to its include (and its descendants)
but is not "visible" to siblings.

#### Example

layout.html:

```
<!doctype html>
<html>
  <head>
  </head>
  <body>
    <block:content/>
  </body>
</html>
```

index.html:

```
<include file='layout.html'>

  <def:content>
    <h1>Hello World!</h1>
  </def:content>

</include>
```

Rendered index.html:

```
<!doctype html>
<html>
  <head>
  </head>
  <body>
    <h1>Hello World!</h1>
  </body>
</html>
```

## Grammar

A [PegJS](http://pegjs.org) grammar [is available](https://github.com/inca/nanotemplates/tree/master/grammar/template.peg).

## Notes on compilation

Tags like `include`, `inline`, `block`, `def`, `append`, `prepend`, etc. are
compiled _statically_. This means no support for dynamic includes (sorry), but
OTOH you can cache statically compiled functions for rendering same templates with different data almost at the light speed.

Compilation is done like this:

  * AST nodes are visited recursively with `_process_<nodetype>` methods;
  * each method returns a string statement (code);
  * you can use stuff from `runtime.js` in statements (but not in templates themselves);
  * buffered statements (the ones that actually spit content) look like `out.push(something)`;
  * expressions are compiled via Angular Expressions library, each expression is pushed into an array and becomes available inside code via `$$[<index>]`;
  * `locals` object is the data you provide to compiled function at rendering stage;
  * every scope-sensitive code is wrapped into a function, which copies locals object;
  * all statements are simply joined with semicolon and are wrapped into `function(locals) { }`

## License

Copyright (C) 2015 Boris Okunskiy <boris@okunskiy.name> (ISC license)

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.
