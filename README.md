# Nanotemplates

Minimalistic template engine for composing DRY HTML pages.

## Key features

  * **Safety** — runtime is done via Angular expressions engine (which is considered safe),

  * **Intuitive** — extremely simple, yet enormously powerful

  * **IDE-friendly** — templates are based on custom HTML tags, so you don't have
    to install code highlighters

  * **Performance** — once compiled the templates can be cached to provide light-speed rendering

  * **Flexible** — template loading is abstracted from file system: it is easy to implement custom loading (e.g. from database or network).

Nanotemplates are best suited for HTML, but you can use them to
render virtually any text.

## Usage

```
// Configure renderer instance
var nano = require('nanotemplates')({
  basedir: 'templates/directory'
});

// Render file
nano.render('path/to/template.html', { data: 'values' }, function(err, html) {
  // ...
});

// Compile into reusable template
nano.compile('path/to/template.html', function(err, fn) {
  // ...
  fn({ data: 'values' });
});
```

Templates are resolved relatively to `basedir`. Paths inside include tags are
relative to their call site (e.g. including `../layout.html` from
`templates/users/index.html` will include `templates/layout.html`).

Referencing templates outside `basedir` is not allowed.

## Compiling and rendering

Like with almost every other template engines, Nanotemplates are processed in two phases:

  * _compiling_ involves loading files, parsing them, processing compile-time stuff and generating a reusable template function;

  * _rendering_ involves invoking the template function with data object

Once template function is compiled it can be invoked with different data objects.
It is generally a good practice to cache compiled functions in production
to speed things up.

## Templates Syntax — Static Constructs

Following features are processed _statically_ (at compile time).

### Includes

One file can be included into another one with `<include file="path/to/file"/>`.

Paths that start with `/` are relative to `basedir`, all other paths are relative
to the file where they are used.

Simple includes are useful for reusing fragments.

Includes are processed statically, so there is currently no support for dynamic values in paths (sorry about that).

#### Example

index.html:

    <!doctype html>
    <html>
      <head>
      </head>
      <body>
        <include file='header.html'/>
        <h1>Content</h1>
      </body>
    </html>

header.html:

    <header>Hello World!</header>

Rendered index.html:

    <!doctype html>
    <html>
      <head>
      </head>
      <body>
        <header>Hello World!</header>
        <h1>Content</h1>
      </body>
    </html>

### Layouts, blocks, definitions

More complex template composition scenarios involve reusing of _layouts_ (abstract markup that defines document structure) and _components_ (self-contained markup with parameters).

These scenarios can be implemented by using includes together with _blocks_ — named placeholders for actual content. Blocks can be declared anywhere using `<block:block_name>` tag, they can also contain
arbitrary default content.

Concrete pages provide block definitions using `<def:block_name>` inside
`<include>` tags. Each definition is local to its include (and its descendants)
but is not "visible" to siblings.

#### Example

layout.html:

    <!doctype html>
    <html>
      <head>
      </head>
      <body>
        <block:content/>
      </body>
    </html>

index.html:

    <include file='layout.html'>

      <def:content>
        <h1>Hello World!</h1>
      </def:content>

    </include>

Rendered index.html:

    <!doctype html>
    <html>
      <head>
      </head>
      <body>
        <h1>Hello World!</h1>
      </body>
    </html>

#### More complex example

It is often convenient to inherit layouts. Consider the following example (based on the previous one).

users/layout.html:

    <include file='../layout.html'>

      <def:content>
        <nav>
          <a href='/'>Back to home</a>
        </nav>
        <section>
          <block:content/>
        </section>
      </def:content>

    </include>

users/list.html:

    <include file='layout.html'>

      <def:content>
        <ul>
          <li>Alice</li>
          <li>Joe</li>
          <li>Jane</li>
        </ul>
      </def:content>

    </include>

Rendered users/list.html:

    <!doctype html>
    <html>
      <head>
      </head>
      <body>
        <nav>
          <a href='/'>Back to home</a>
        </nav>
        <section>
          <ul>
            <li>Alice</li>
            <li>Joe</li>
            <li>Jane</li>
          </ul>
        </section>
      </body>
    </html>

You see, users/layout.html provides partial definition for `content` by defining
another block (with the same name). In fact, the result is quite intuitive if you
follow the templates code "inside-out" (`users/list.html` -> `users/layout.html` -> `layout.html`).

### Inline file

Use `<inline file="some/file"/>` to include the contents of specified file "as is".

Unline includes, inlined files are not compiled (so blocks and definitions are not supported).

By default, the contents of inlined file will be HTML-escaped to prevent XSS (i.e. `<` are replaced with `&lt;`, '&' with '&amp;', etc.). To disable escaping type `!` at the start of file path `<inline file="!path/to/file"/>`.

## Template Syntax — Dynamic Constructs

Following features involve working with template data (at the render phase).

Most dynamic constructs are _scoped_, i.e. variables defined in inner tags
are not visible outside.

### Expressions

Expressions are used to access and modify data provided at the rendering phase.

Expressions are parsed with [Angular Expressions](https://github.com/peerigon/angular-expressions)
which currently represent the safest way to execute simple JavaScript statements
while disallowing access to potentially harmful constructs like `eval` or `Function`.

Also, Angular expressions are awesome, because they are forgiving to nulls and undefined variables.

#### Interpolation

Expressions like `#{user.name || 'Anonymous'}` are evaluated at rendering phase and their results are included into the rendered templates. In the example above `user` may not exist, or may not have `name` property — in both cases the "Anonymous" will be rendered.

#### Escaping

Expressions in `#{expr}` are HTML-escaped (i.e. `<` are replaced with `&lt;`, `&` — with `&amp;`, etc.) To avoid escaping use `!{expr}` syntax.

### Variable Assignment

Use `<var:myVar>expr</var:myVar>` to define `myVar` variable with value equal to
the result of `expr` evaluation.

Variables defined on "top-level" scope are bound directly to `data` object, but variables from inner scopes do not leak outside.

### If Statement

Conditional statements are implemented like this:

    <if>
      <when expr="!friends">
        <p>You have no friends.</p>
      </when>
      <when expr="friends == 1">
        <p>You have one friend.</p>
      </when>
      <when expr="friends > 1 && friends < 5">
        <p>You have a few friends.</p>
      </when>
      <otherwise>
        <p>You have #{friends} friends.</p>
      </otherwise>
    </if>

### Case Statement

Case statements resemble regular switch-case, but allow matching non-declarative conditions:

    <case:e expr="friends">
      <when expr="1">
        <p>You have one friend.</p>
      </when>
      <when expr="e > 1 && e <= 5">
        <p>You have a few friends.</p>
      </when>
      <when expr="e > 5">
        <p>You have a #{e} friends.</p>
      </when>
      <otherwise>
        <p>You have no friends.</p>
      </otherwise>
    </case:e>

In this example `friends` expression is evaluated and becomes accessible as local variable `e`.

### Each Statement

To iterate over collections (arrays or objects) use `<each:varName in="collection">...`.

#### Each with Array

Let's say your data looks like this:

```
{
  users: [
    { name: 'Alice' },
    { name: 'Joe' },
    { name: 'Jane' }
  ];
}
```

And your template like this:

    <ul>
      <each:user in="users">
        <li>#{user_index}: #{user.name}</li>
      </each:user>
    </ul>

Here's what will be rendered:

    <ul>
      <li>0: Alice</li>
      <li>1: Joe</li>
      <li>2: Jane</li>
    </ul>

There you define the `user` variable which will hold the value on each iteration.
Additionally, the `user_index` will contain the numeric zero-based index of
an element on each iteration.

#### Each with Object

Let's say your data looks like this:

```
{
  users: {
    alice: 'Alice',
    bob: 'Bob'
  };
}
```

And your template like this:

    <ul>
      <each:user in="users">
        <li>#{user_key}: #{user}</li>
      </each:user>
    </ul>

Here's what will be rendered:

    <ul>
      <li>alice: Alice</li>
      <li>bob: Bob</li>
    </ul>

Again, `user` variable holds the value on each iteration.
Additionally, the key is bound to `user_key` variable.

Keys are always sorted in alphabetical order.

## Template Loading

Although it may seem that Nanotemplates heavily depend on file system, the engine
itself is abstracted.

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

## Premise

There are lots of template engines for Node.js, both [simple](http://underscorejs.org) and [immense](http://jade-lang.com).

Just like you we hate reinventing the wheels. However, we started this project, because, apparently, no template engine out there can simultaneously meet three following conditions:

  * does not allow arbitrary JavaScript execution like `for (;;) { }`, so that
    it could be used by untrusted users;
  * is flexible enough to write almost any app you could think of (i.e.
    supports includes, layouts, scoping, etc, etc, etc);
  * provides abstraction layer over file system (e.g. to be able to load
    templates from database or via network)

We hope that Nanotemplates are what you are expecting them to be.

## Contributing

We're glad you asked!

Ultimately the best way to contribute to the project is to try it out and share your opinion. Feel free to fire issues and send pull requests.

If you feel like spending a coin for a good cause, we kindly accept your generosity at [Gratipay](https://gratipay.com/inca) or PayPal ([boris@okunskiy.name](mailto:boris@okunskiy.name)).

## License

Copyright (C) 2015 Boris Okunskiy <boris@okunskiy.name> (ISC license)

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.
