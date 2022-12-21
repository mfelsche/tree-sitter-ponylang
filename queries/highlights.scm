; names to assign: 
; - attribute
; - comment
; - constant
; - constant.builtin
; - constructor
; - embedded
; - keyword
; - function
; - function.builtin
; - module
; - number
; - operator
; - punctuation.bracket
; - punctuation.delimiter
; - property
; - string
; - string.special
; - tag
; - type
; - type.builtin
; - variable
; - variable.parameter,
(entity 
  entity_type: (entity_type) @keyword
  name: (identifier) @type
  "is" @keyword
  docstring: (string) @string.special
)
[
 "if"
 "then"
 "else"
 "elseif"
 "end"
 "try"
 "while"
 "for"
 "use"
 "as"
 "var"
 "let"
 "embed"
 "fun"
 "be"
 "new"
] @keyword
[
 "("
 ")"
] @punctuation.bracket
[
 (partial)
 "=>"

 "~"
 ".>"

 "+"
 "-"
 "*"
 "/"
 "%"
 "%%"
 "+~"
 "-~"
 "/~"
 "*~"
 "%~"
 "%%~"

 ">>"
 "<<"
 ">>~"
 "<<~"

 "=="
 "!="
 ">"
 "<"
 ">="
 "<="

 "and"
 "or"
 "xor"
 "is"
 "isnt"
] @operator
[
 (line_comment)
 (block_comment)
] @comment
(bool) @constant.builtin
(number) @number
(string) @string
(cap) @keyword
(field
  name: (identifier) @property
  docstring: (string) @string.special
)
; constructors / methods / behaviours
(method
  name: (identifier) @constructor
  params: (params (param (identifier) @variable.parameter))
  docstring: (string) @string.special
)
(type name: (identifier) @type)
(typeparams (typeparam name: (identifier) @type))
(identifier) @variable
