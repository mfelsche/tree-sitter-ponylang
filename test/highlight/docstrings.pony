"""
module docstring
"""
// <- string.special
actor Main
  """
  entity docstring
  """
//^ string.special

  var field: Type
    """field docstring"""
//  ^ string.special

  new create(env: Env) =>
    """
    constructor docstring
    """
//  ^ string.special
    ""
//  ^ string
  be behavior() =>
    "docstring"
//  ^ string.special
    """
    regular string
    """
//  ^ string
  fun method(): ReturnType =>
    """
    docstring
    """
//  ^ string.special
    "
    regular string
    "
//  ^ string


