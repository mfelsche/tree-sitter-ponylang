module.exports = grammar({
  name: 'ponylang',

  extras: $ => [/\s|\\\n/, $.line_comment, $.block_comment],
  externals: $ => [
    $.block_comment,
    $.string
  ],
  rules: {
    source_file :  $ => seq(optional($.string), repeat($.use)/*TODO: , repeat($.class_def)*/),
    line_comment:  $ => token(seq('//', /.*/)),
    cap:           $ => choice('iso', 'trn', 'ref', 'val', 'box', 'tag'),
    gencap:        $ => choice('#read', '#send', '#share', '#alias', '#any'),
    _type_cap:     $ => seq(choice($.cap, $.gencap), optional(choice('^', '!'))),
    _nominal_type: $ => seq(
                         field('name', seq($.identifier, optional(seq('.', $.identifier)))), 
                         optional(field('typeargs', $.typeargs)),
                         optional(field('cap',$._type_cap ))
                       ),
    _infix_type:   $ => seq($.type, repeat(seq(choice('|', '&'), $.type))),
    _grouped_type: $ => seq('(', $._infix_type, repeat(seq(',', $._infix_type)), ')'),
    _lambda_type:  $ => seq(
        choice('{', '@{'), 
        optional($.cap),
        optional(field('name', $.identifier)),
        optional(field('typeparams', $.typeparams)),
        '(',
        seq($.type, repeat(seq(',', $.type))),
        ')',
        optional(seq(':', field('return_type', $.type))),
        optional($.partial),
        '}', 
        optional($._type_cap)
    ),
    type:         $ => seq(
                         choice('this', $.cap, $._nominal_type, $._grouped_type, $._lambda_type),
                         optional(field('viewpoint', seq('->', $.type)))
    ),
    asop:         $ => seq('as', $.type),
    term:         $ => 'TODO', // TODO
    binop:        $ => seq(choice('+', '-'), $.term), // TODO: more operators
    infix:        $ => seq($.term, repeat(choice($.binop, $.asop))),
    identifier:   $ => seq(/[a-zA-Z_]/, repeat(/[a-zA-Z0-9_']/)),
    param:        $ => seq($.identifier, ':', $.type, optional(seq('=', $.infix))),
    params:       $ => seq($.param, repeat(seq(',', $.param))),
    typeparam:    $ => seq(
        field('name', $.identifier), 
        optional(field('constraint', seq(':', $.type))),
        optional(field('default', seq('=', $.type)))
    ),
    typeparams:   $ => seq('[', $.typeparam, repeat(seq(',', $.typeparam)), ']'),
    typeargs:     $ => seq('[', $.type, repeat(seq(',', $.type)), ']'), // TODO: const and literal typeargs
    partial:      $ => token('?'),
    _use_name:    $ => seq(field('name', $.identifier), '='),
    _use_ffi:     $ => seq('@', 
                          field("name", choice($.identifier, $.string)), 
                          field('return_type', $.typeargs), 
                          '(', optional(field('params', $.params)), ')', optional(field('partial', $.partial))
                      ),
    use:          $ => seq(
                        'use', 
                        optional(field('name', $._use_name)), 
                        field('specifier', choice($.string, $._use_ffi)), 
                        optional(field('condition', $.infix))), 
  }
});
