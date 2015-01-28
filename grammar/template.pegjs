Nodes
  = Node*

Node
  = Include
  / Block
  / Plain

// Includes

Include
  = IncludeSelfClosing
  / IncludeWithDefs

IncludeSelfClosing
  = tag: IncludeTagStart '/>'
  {
    return {
      node: 'include',
      file: tag.file,
      defs: []
    }
  }

IncludeWithDefs
  = tag: IncludeTagStart '>' ws* defs:Def* ws* '</include' ws* '>'
  {
    return {
      node: 'include',
      file: tag.file,
      defs: defs
    }
  }

IncludeTagStart
  = '<include' ws+ 'file' ws* '=' ws* file:AttrValue ws*
  {
    return {
      file: file
    }
  }

// Defs

Def "def"
  = '<' def: DefTag ':' name: VarName ws* '>'
    nodes: Nodes
    '</' _def: DefTag & { return def == _def }
    ':'
    _name: VarName & { return name == _name }
    ws* '>'
    
  {
    return {
      node: 'def',
      mode: def,
      name: name,
      nodes: nodes
    }
  }
  
DefTag
  = 'def'
  / 'append'
  / 'prepend'

// Blocks

Block
  = '<block:' name: VarName ws* '>'
    nodes: Nodes
    '</block:' _name: VarName & { return name == _name }
    ws* '>'

  {
    return {
      node: 'block',
      name: name,
      nodes: nodes
    }
  }

// Plain text

Plain "plain text"
  = $(PlainToken+)

PlainToken
  = [^<]
  / '<' '/'?
    !'include'
    !'block'
    !'def'
    !'append'
    !'prepend'
    

// Commons

VarName "variable name"
  = $( [a-z] [a-zA-Z0-9_]* )

AttrValue "attribute value"
  = SingleQuoteString
  / DoubleQuoteString

SingleQuoteString "string"
  = "'" chars:$(SingleQuoteChar*) "'"
  { return chars }

DoubleQuoteString "string"
  = '"' chars:$(DoubleQuoteChar*) '"'
  { return chars }

SingleQuoteChar
  = [^']

DoubleQuoteChar
  = [^"]

ws "whitespace"
  = [ \t\n\r]
