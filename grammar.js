module.exports = grammar({
    name: 'ponylang',

  extras: $ => [/\s|\\\n/, $.line_comment, $.block_comment],
  externals: $ => [
    $.block_comment,
    $.string
  ],
  supertypes: $ => [
    $._term,
  ],
  word:            $ => $.identifier,
  rules: {
    source_file :  $ => seq(optional($.string), repeat($.use), repeat($.entity)),
    line_comment:  $ => token(seq('//', /.*/)),
    cap:           $ => choice('iso', 'trn', 'ref', 'val', 'box', 'tag'),
    gencap:        $ => choice('#read', '#send', '#share', '#alias', '#any'),
    _type_cap:     $ => seq(choice($.cap, $.gencap), optional(choice('^', '!'))),
    _nominal_type: $ => seq(
                         field('name', seq($.identifier, optional(seq('.', $.identifier)))), 
                         optional(field('typeargs', $.typeargs)),
                         optional(field('cap',$._type_cap ))
                       ),
    union_type:     $ => seq($._inner_type, repeat1(seq('|', $._inner_type))),
    isect_type:     $ => seq($._inner_type, repeat1(seq('&', $._inner_type))),
    tuple_type:     $ => seq($._inner_type, repeat1(seq(',', $._inner_type))),
    _grouped_type:  $ => seq(
        '(', 
        choice(
            $._inner_type,
            $.union_type,
            $.isect_type,
            $.tuple_type
        ), 
        ')'
    ),
    lambda_type:    $ => seq(
        choice('{', '@{'), 
        optional($.cap),
        optional(field('name', $.identifier)),
        optional(field('typeparams', $.typeparams)),
        '(',
        seq($._inner_type, repeat(seq(',', $._inner_type))),
        ')',
        optional(seq(':', field('return_type', $._inner_type))),
        optional($.partial),
        '}', 
        optional($._type_cap)
    ),
    _inner_type:    $ => seq(
                         choice('this', $.cap, $._nominal_type, $._grouped_type, $.lambda_type),
                         optional(field('viewpoint', seq('->', $._inner_type)))
    ),
    type:           $ => $._inner_type,
    asop:           $ => prec(2, seq(
        field('lhs', $._term),
        'as',
        field('rhs', $.type))
    ),
    consume:        $ => seq('consume', optional($.cap), $._term),
    // jumps
    "return":       $ => seq('return', optional($.block)),
    "break":        $ => seq('break', optional($.block)),
    "continue":     $ => seq('continue', optional($.block)),
    "error":        $ => seq('error', optional($.block)),
    "compile_intrinsic":  $ => seq('compile_intrinsic', optional($.block)),
    "compile_error":  $ => seq('compile_error', optional($.block)),
    _jump:        $ => choice(
            $["return"],
            $["break"],
            $["continue"],
            $.error,
            $.compile_intrinsic,
            $.compile_error
    ),
    assignment:   $ => seq(
        $._infix,
        optional(
            seq(
                '=',
                $.assignment
            )
        )
    ),
    _block_exprs:       $ => seq(
        $.assignment,
        repeat(seq(optional(';'), $.assignment))
    ),
    block:     $ => choice(
        seq($._block_exprs, optional($._jump)),
        $._jump
    ),
    annotations:  $ => seq('\\', $.identifier, repeat(seq(',', $.identifier))),
    recover:      $ => seq('recover', optional($.annotations), optional($.cap), $.block, 'end'),
    elseif:       $ => seq(
        'elseif',
        optional($.annotations),
        field('condition', $.block),
        'then',
        field('if_block', $.block)
    ),
    "if":         $ => seq(
        'if',
        optional($.annotations),
        field('condition', $.block),
        'then',
        field('if_block', $.block),
        repeat(
            $.elseif
        ),
        optional(
            seq('else', field('else_block', $.block)),
        ),
        'end'
    ),
    local:        $ => seq(
        choice('var', 'let', 'embed'),
        $.identifier,
        optional(
            seq(
                ':',
                $.type
            )
        )
    ),
    _term:        $ => choice(
        // TODO: add more
        $.identifier,
        $.local,
        $["if"],
        $.consume,
        $.recover,
        $.string
    ),
    _partial_ops: $ => choice(
                            'and',
                            'or',
                            'xor',
                            '+', 
                            '-',
                            '/',
                            '*',
                            '%',
                            '%%',
                            '+~',
                            '-~',
                            '/~',
                            '*~',
                            '%~',
                            '%%~',
                            '>>',
                            '<<',
                            '>>~',
                            '<<~',
                            '==',
                            '!=',
                            '>',
                            '<',
                            '>=',
                            '<='),
    binop:        $ => prec(1, seq(
        field('lhs', $._term), 
        choice(
            seq($._partial_ops, optional($.partial)),
            choice('is', 'isnt')
        ),
        field('rhs', $._term)
    )),
    _infix:       $ => choice(
        $._term,
        $.binop,
        $.asop
    ),
    identifier:   $ => token(seq(/[a-zA-Z_]/, repeat(/[a-zA-Z0-9_']/))),
    param:        $ => seq($.identifier, ':', $.type, optional(seq('=', $._infix))),
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
                        optional(seq('if', field('condition', $._infix)))), 
    field:        $ => seq(
                        choice('var', 'let', 'embed'),
                        field('name', $.identifier),
                        seq(
                            ':',
                            field('type', $.type)
                        ),
                        optional(seq('=', field('default', $._infix ))),
                        optional(field('docstring', $.string))
                       ),
    method:       $ => seq(
                        choice('fun', 'be', 'new'),
                        optional($.annotations),
                        optional(
                            choice(
                                field('receiver_cap', $.cap),
                                '@'
                            )
                        ),
                        field('name', $.identifier),
                        '(', optional(field('params', $.params)), ')',
                        optional(seq(':', field('return_type', $.type))),
                        optional($.partial),
                        optional(field('docstring', $.string)),
                        optional(seq('=>', field('body', $.block)))
                       ),
    fields:       $ => repeat1($.field),
    methods:      $ => repeat1($.method),
    entity:       $ => seq(
                        field('entity_type', choice('type', 'interface', 'trait', 'primitive', 'struct', 'class', 'actor')),
                        optional($.annotations),
                        optional(token('@')),
                        optional(field('default_cap', $.cap)),
                        field('name', $.identifier),
                        optional($.typeparams),
                        optional(seq('is', field('provides', $.type))),
                        optional(field('docstring', $.string)),
                        optional(field('fields',  $.fields)), 
                        optional(field('methods', $.methods))
                       )
  }
});
