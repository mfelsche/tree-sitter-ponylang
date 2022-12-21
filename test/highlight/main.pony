use "collection" if windows
// <- keyword
//  ^ string
//               ^ keyword
//                  ^ variable
actor Main
// <- keyword
//    ^ type
  new create(env: Env) =>
// ^ keyword
//    ^ constructor
//          ^ punctuation.bracket
//           ^ variable.parameter
//                ^ type
//                   ^ punctuation.bracket
//                     ^ operator
    env.out.print("awesome" * 2)
//                 ^ string
//                          ^ operator
//                            ^ number

  fun ref awesome(): Bool => true
  // <- keyword
  //  ^ keyword
  //      ^ function
  //         ^ punctuation.bracket
  //          ^ punctuation.bracket
  //             ^ type
  //                     ^ constant

  be yeah[Arg: Constraint](foo: Array[U8]) =>
  // <- keyword
  //  ^ function
  //      ^ type
  //           ^ type
  //                       ^ variable.parameter
  //                            ^ type
  //                                  ^type
    foo~partial(56.7)
  //^ variable
  //   ^ operator
  //            ^ number
