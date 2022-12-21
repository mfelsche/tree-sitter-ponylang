const PREC = {
  binary_op: 4,
  unary_op: 6,
  call: 7,
  field: 7
};

module.exports = grammar({
    name: 'ponylang',

    extras: $ => [/\s|\\\n/, $.line_comment, $.block_comment],
    externals: $ => [
        $.block_comment,
        $.string
    ],
    conflicts: $ => [
        //[$.atom, $._term]
    ],
    supertypes: $ => [
        $._term,
    ],
    word: $ => $.identifier,
    rules: {
        source_file: $ => seq(
            field('docstring', optional($.string)), 
            repeat($.use), 
            repeat($.entity)
        ),
        line_comment: $ => token(seq('//', /.*/)),

        // type
        cap: $ => choice('iso', 'trn', 'ref', 'val', 'box', 'tag'),
        gencap: $ => choice('#read', '#send', '#share', '#alias', '#any'),
        _type_cap: $ => prec.right(
            seq(
                choice(
                    $.cap, 
                    $.gencap
                ), 
                optional(choice('^', '!'))
            )
        ),
        nominal_type: $ => prec.right(seq(
            field('name', sep1('.', $.identifier)),
            optional(field('typeargs', $.typeargs)),
            optional(field('cap', $._type_cap))
        )),
        union_type: $ => sep2('|', $._inner_type),
        isect_type: $ => sep2('&', $._inner_type),
        tuple_type: $ => sep2(',', $._inner_type),
        _grouped_type: $ => seq(
            '(',
            choice(
                $._inner_type,
                $.union_type,
                $.isect_type,
                $.tuple_type
            ),
            ')'
        ),
        lambda_type: $ => seq(
            choice('{', '@{'),
            optional($.cap),
            optional(field('name', $.identifier)),
            optional(field('typeparams', $.typeparams)),
            '(',
            commaSep1($._inner_type),
            ')',
            optional(seq(':', field('return_type', $._inner_type))),
            optional($.partial),
            '}',
            optional($._type_cap)
        ),
        // ponyc rule: type
        _inner_type: $ => seq(
            choice(
                'this', 
                $.cap, 
                $.nominal_type, 
                $._grouped_type, 
                $.lambda_type
            ),
            optional(field('viewpoint', seq('->', $._inner_type)))
        ),
        type: $ => $._inner_type,

        // expr AS type - a partial cast
        asop: $ => prec(2, seq(
            field('lhs', $._term),
            'as',
            field('rhs', $.type))
        ),
        //isop: $ => prec(2, seq(
        //    field('lhs', $._term),
        //    choice('is', 'isnt'),
        //    field('rhs', $._term))
        //),
        consume: $ => prec(
            3, 
            seq('consume', optional($.cap), $._term)
        ),
        // jumps
        "return": $ =>              prec.left(seq('return', optional($.block))),
        "break": $ =>               prec.left(seq('break', optional($.block))),
        "continue": $ =>            prec.left(seq('continue', optional($.block))),
        "error": $ =>               prec.left(seq('error', optional($.block))),
        "compile_intrinsic": $ =>   prec.left(seq('compile_intrinsic', optional($.block))),
        "compile_error": $ =>       prec.left(seq('compile_error', optional($.block))),
        _jump: $ => choice(
            $["return"],
            $["break"],
            $["continue"],
            $.error,
            $.compile_intrinsic,
            $.compile_error
        ),
        assignment: $ => seq(
            $._term,
            seq(
                '=',
                $.assignment
            )
        ),
        _block_expr: $ => prec(2, choice(
            $._term,
            $.assignment
        )),
        _block_exprs: $ => prec.right(seq(
            $._block_expr,
            repeat(seq(optional(';'), $._block_expr))
        )),
        block: $ => prec.right(
            choice(
                seq($._block_exprs, optional($._jump)),
                $._jump
            )
        ),
        annotations: $ => seq('\\', commaSep1($.identifier)),
        recover: $ => seq('recover', optional($.annotations), optional($.cap), $.block, 'end'),
        // id or sequence of ids
        idseq: $ => choice(
            $.identifier,
            seq(
                '(',
                commaSep1($.identifier),
                ')'
            )
        ),
        "for": $ => seq(
            'for',
            optional($.annotations),
            field('element', $.idseq),
            'in',
            field('iterator', $.block),
            'do',
            field('body', $.block),
            optional(
                seq(
                    'else',
                    optional($.annotations),
                    field('else_block', $.block)
                )
            ),
            'end'
        ),
        "while": $ => seq(
            'while',
            optional($.annotations),
            field('condition', $.block),
            'do',
            field('body', $.block),
            optional(
                seq(
                    'else',
                    optional($.annotations),
                    field('else_block', $.block)
                )
            ),
            'end'
        ),
        "repeat": $ => seq(
            'repeat',
            optional($.annotations),
            field('body', $.block),
            'until',
            optional($.annotations),
            field('condition', $.block),
            optional(
                seq(
                    'else',
                    optional($.annotations),
                    field('else_block', $.block)
                )
            ),
            'end'
        ),
        withelem: $ => seq(
            field('name', $.idseq),
            '=',
            field('initialiser', $.block),
        ),
        withexpr: $ => commaSep1($.withelem),
        with: $ => seq(
            'with',
            optional($.annotations),
            $.withexpr,
            'do',
            field('body', $.block),
            optional(
                seq(
                    'else',
                    optional($.annotations),
                    field('else_block', $.block)
                )
            ),
            'end'
        ),
        try_block: $ => seq(
            'try',
            optional($.annotations),
            field('body', $.block),
            optional(
                seq(
                    'else',
                    optional($.annotations),
                    field('else_block', $.block)
                )
            ),
            optional(
                seq(
                    'then',
                    optional($.annotations),
                    field('then_block', $.block)
                )
            ),
            'end'
        ),
        elseif: $ => seq(
            'elseif',
            optional($.annotations),
            field('condition', $.block),
            'then',
            field('if_block', $.block)
        ),
        // ponyc grammar rule: cond
        "if": $ => seq(
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
        // maybe simplify all the ifs down to one, maybe differentiation not needed for treesitter
        elseifdef: $ => seq(
            'elseif',
            optional($.annotations),
            field('condition', $._term),
            'then',
            field('if_block', $.block)
        ),
        ifdef: $ => seq(
            'ifdef',
            optional($.annotations),
            field('condition', $._term),
            'then',
            field('if_block', $.block),
            repeat(
                $.elseifdef
            ),
            optional(
                seq('else', field('else_block', $.block))
            ),
            'end'
        ),
        // what is in iftype ... 
        _iftype: $ => seq(
            field('type', $.type),
            '<:',
            field('subtype', $.type),
            'then',
            field('if_block', $.block),
        ),
        elseiftype: $ => seq(
            'elseif',
            optional($.annotations),
            field('iftype', $._iftype)
        ),
        // the iftype clause
        iftype: $ => seq(
            'iftype',
            optional($.annotations),
            field('iftype', $._iftype),
            repeat(
                $.elseiftype
            ),
            optional(
                seq('else', field('else_block', $.block))
            ),
            'end'
        ),
        // local variable definition
        // ('var' | 'let' | 'embed' ) $.identifier [':' $.type]
        local: $ => seq(
            choice('var', 'let', 'embed'), // TODO: match capture
            field('name', $.identifier),
            optional(
                seq(
                    ':',
                    $.type
                )
            )
        ),
        field_access: $ => prec(PREC.field, seq(
            field('base', $._term),
            '.',
            field('field', $.identifier)
        )),
        partial_application: $ => prec(PREC.call, seq(
            $._term,
            '~', 
            $.identifier
        )),
        chain: $ => prec(PREC.call, seq(
            $._term,
            '.>',
            $.identifier
        )),
        call: $ => prec(PREC.call, seq(
            field('callee', $._term),
            '(',
            field('arguments', seq(
                optional(
                    field('positional', $.positional_args)
                ),
                optional(
                    field('named', $.named_args)
                )
            )),
            ')',
            optional($.partial)
        )),
        term_with_typeargs: $ => seq(
            $._term,
            $.typeargs
        ),
        bool: $ => choice(
            'true',
            'false'
        ),
        number: $ => {
            const decimal = /[0-9][0-9_]*/;
            const hexadecimal = /[0-9a-fA-F][0-9a-fA-F_]*/;
            const binary = /[01][01_]*/;
            return token(seq(
                choice(
                    seq(/0[xX]/, hexadecimal),
                    seq(/0[bB]/, binary),
                    seq(decimal, optional('.'), optional(decimal))
                ),
                optional(/[eE][+-]?\d+/)
            ))
        },
        _literal: $ => choice(
            $.bool,
            $.number,
            $.string
        ),
        array: $ => seq(
            '[',
            optional(
                seq(
                    'as',
                    $.type,
                    ':'
                )
            ),
            $.block,
            ']'
        ),
        // TODO
        lambda: $ => seq('{', '}'),
        // TODO
        barelambda: $ => seq('@{', '}'),
        ffi_call: $ => seq(
            '@',
            field('name', choice($.string, $.identifier)),
            '(',
            field('arguments', seq(
                optional(
                    field('positional', $.positional_args)
                ),
                optional(
                    field('named', $.named_args)
                )
            )),
            ')',
            optional($.partial)
        ),
        // ponyc rule: atom
        //atom: $ => choice(
        //    $.identifier, // reference
        //    'this',
        //    $.literal,
        //    seq('(', $.block, ')'), // groupedexpr
        //    $.array,
        //    $.object,
        //    $.lambda,
        //    $.barelambda,
        //    $.ffi_call,
        //    '__loc',
        //    $["if"],
        //    $["while"],
        //    $["repeat"],
        //    $["for"]
        //),
        unary_op: $ => prec(PREC.unary_op, seq(
            choice('!', '&', '-', '-~', 'digestof'),
            field("value", $._term)
        )),
        // ponyc rule: parampattern
        //_parampattern: $ => prec.left(seq(
        //   repeat(
        //        choice('!', '&', '-', '-~', 'digestof')
        //    ),
        //    field("value", $.atom),
        //    repeat(
        //        $._postfix
        //    )
        //)),
        //pattern: $ => choice(
        //    $.local,
        //    $.postfix
        //),

        match_case: $ => seq(
            '|',
            optional($.annotations),
            optional(
                field('pattern', $._term)
            ),
            optional(
                seq(
                    'if',
                    field('guard', $.block)
                )
            ),
            optional(
                seq(
                    '=>',
                    optional($.annotations),
                    field('body', $.block)
                )
            )
        ),
        match: $ => seq(
            'match',
            optional($.annotations),
            field('match', $.block),
            repeat(
                $.match_case
            ),
            optional(
                seq(
                    'else',
                    optional($.annotations),
                    field('else_block', $.block)
                )
            ),
            'end'
        ),
        _term: $ => choice(
            $.identifier, // reference
            'this',
            $._literal,
            $.array,
            $.object,
            $.lambda,
            $.barelambda,
            $.ffi_call,
            '__loc',
            $["if"],
            $.ifdef,
            $.iftype,
            $.match,
            $["while"],
            $["repeat"],
            $["for"],
            $.with,
            $.try_block,
            $.recover,
            $.consume,
            $.local,
            $.unary_op,
            $.binop,
            $.asop,
            $.field_access,
            $.partial_application,
            $.chain,
            $.call,
            $.grouped,
            $.term_with_typeargs
            // TODO: const_expr (not yet supported in ponyc)
        ),
        grouped: $ => seq(
            '(', $.block, ')'
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
        // binary operation
        binop: $ => prec.left(1, seq(
            field('lhs', $._term),
            field('operator', choice(
                seq($._partial_ops, optional($.partial)),
                choice('is', 'isnt')
            )),
            field('rhs', $._term)
        )),
        unary_op: $ => prec.left(
            seq(
                field('operator', choice('!', '&', '-', '-~', 'digestof')),
                $._term
            )
        ),
        //_infix: $ => choice(
        //    $._term,
        //    $.binop,
        //    $.asop,
        //),
        // ponyc rule: ref
        identifier: $ => token(seq(/[a-zA-Z_]/, repeat(/[a-zA-Z0-9_']/))),
        param: $ => seq($.identifier, ':', $.type, optional(seq('=', $._term))),
        params: $ => commaSep1($.param),
        // TODO
        positional_args: $ => commaSep1($.block),
        named_arg: $ => seq(
            field('name', $.identifier),
            '=',
            field('value', $.block)
        ),
        named_args: $ => seq(
            'where',
            commaSep1($.named_arg),
        ),
        typeparam: $ => seq(
            field('name', $.identifier),
            optional(field('constraint', seq(':', $.type))),
            optional(field('default', seq('=', $.type)))
        ),
        typeparams: $ => seq('[', commaSep1($.typeparam), ']'),
        typeargs: $ => seq('[', commaSep1($.type), ']'), // TODO: const and literal typeargs
        partial: $ => '?',
        _use_name: $ => seq(field('name', $.identifier), '='),
        _use_ffi: $ => seq('@',
            field("name", choice($.identifier, $.string)),
            field('return_type', $.typeargs),
            '(', optional(field('params', $.params)), ')', optional(field('partial', $.partial))
        ),
        use: $ => seq(
                'use',
                optional(field('name', $._use_name)),
                field('specifier', choice($.string, $._use_ffi)),
                optional(seq('if', field('condition', $._term)))
        ),
        field: $ => seq(
            choice('var', 'let', 'embed'),
            field('name', $.identifier),
            seq(
                ':',
                field('type', $.type)
            ),
            optional(seq('=', field('default', $._term))),
            optional(field('docstring', $.string))
        ),
        method: $ => seq(
            'fun',
            $._method_common
        ),
        behavior: $ => seq(
            'be',
            $._method_common
        ),
        constructor: $ => seq(
            'new',
            $._method_common
        ),
        _method_common: $ => seq(
            optional($.annotations),
            optional(
                choice(
                    field('receiver_cap', $.cap),
                    '@'
                )
            ),
            field('name', $.identifier),
            optional(field('typeparams', $.typeparams)),
            '(', optional(field('params', $.params)), ')',
            optional(seq(':', field('return_type', $.type))),
            optional($.partial),
            optional(field('docstring', $.string)),
            optional(seq('=>', field('body', $.block)))
        ),
        fields: $ => repeat1($.field),
        methods: $ => repeat1(choice($.constructor, $.method, $.behavior)),
        object: $ => seq(
            'object',
            optional($.annotations),
            optional(
                field('cap', $.cap)
            ),
            optional(seq('is', field('provides', $.type))),
            optional(field('fields', $.fields)),
            optional(field('methods', $.methods)),
            'end'
        ),
        // TODO: split up into separate rules for each entity kind for having cleaner rules
        // and not 1 rule with everything mangled
        entity_type: $ => choice('type', 'interface', 'trait', 'primitive', 'struct', 'class', 'actor'),
        entity: $ => seq(
            field('entity_type', $.entity_type),
            optional($.annotations),
            optional(token('@')),
            optional(field('default_cap', $.cap)),
            field('name', $.identifier),
            optional(field('typeparams', $.typeparams)),
            optional(seq('is', field('provides', $.type))),
            optional(field('docstring', $.string)),
            optional(field('fields', $.fields)),
            optional(field('methods', $.methods))
        )
    }
});

function commaSep(rule) {
  return optional(commaSep1(rule))
}

function commaSep1(rule) {
  return sep1(',', rule)
}

function sep1(delimiter, rule) {
  return seq(rule, repeat(seq(delimiter, rule)))
}
function sep2(delimiter, rule) {
  return seq(rule, repeat1(seq(delimiter, rule)))
}
