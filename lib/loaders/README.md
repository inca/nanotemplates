Nanotemplates provides a simple mechanism to load templates from virtually
any source (file system, database, network, etc.).

The whole idea is based on so-called "local paths":

  * when you invoke `compiler.compile('some_dir/another_dir/file')`
    the directory where `some_dir` resides becomes virtual root directory;
  
  * all paths inside templates (e.g. in includes or inlines) are converted by compiler
    into "local paths", which are always relative this virtual root directory;
  
  * compiler takes care to forbid paths that "leak" outside this virtual root.

Template loader is simply a `function (localPath, callback)`,
which loads template content and invokes `callback(err, content)`.
 
We provide a file system loader since it is the most common use case on server,
and a script tag loader for client-side templating.

It is fairly simple to implement a new one (e.g. load templates from
MongoDB or Redis).
