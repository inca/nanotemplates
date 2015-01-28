# Nanotemplates

Miniature framework for composing static HTML pages.

Key features:

  * **safety** — no JavaScript runtime in templates,

  * **flexible** include engine — accomplish your most complex layout scenarios
    in a DRY manner

  * **intuitive** — extremely simple

  * **IDE-friendly** — templates are based on custom HTML tags, so you don't have
    to install custom code highlighters

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

## License

Copyright (C) 2015 Boris Okunskiy <boris@okunskiy.name> (ISC license)

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.
