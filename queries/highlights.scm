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

;; Comments
[
 (line_comment)
 (block_comment)
] @comment

;; Punctuation
[
 "("
 ")"
 "{"
 "}"
 "["
 "]"
] @punctuation.bracket
[
  ";"
  "."
  ","
] @punctuation.delimiter

;; keywords
(cap) @keyword
(entity_type) @keyword
[
 "if"
 "ifdef"
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

;; Operators
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
 "not"
] @operator

;; literals
(bool) @constant.builtin
[
  (integer)
  (float)
] @number

;; strings/docstrings
(source_file docstring: (string) @string.special)
(entity docstring: (string) @string.special)
(constructor body: (block . (string) @string.special))
(method docstring: (string) @string.special)
(method body: (block . (string) @string.special))
(behavior body: (block . (string) @string.special))
(field docstring: (string) @string.special)
(string) @string

;; fields/params and other non-variable identifiers
(field name: (identifier) @property)
(param (identifier) @variable.parameter)

;; Types
(entity name: (identifier) @type)
(nominal_type name: (identifier) @type)
(typeparams (typeparam name: (identifier) @type))
(entity name: (identifier) @type)
;(type) @type



; constructors / methods / behaviours names
(constructor name: (identifier) @constructor)
(method name: (identifier) @function.method)
(behavior name: (identifier) @function.method)

;; variables
(local name: (identifier) @variable)
(identifier) @variable
