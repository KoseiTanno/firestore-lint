import { tokenize } from './lexer.js'
import type {
  AllowNode,
  FunctionNode,
  MatchNode,
  Method,
  ParseError,
  RulesAST,
  ServiceNode,
  Token,
} from './types.js'

export function parse(source: string): RulesAST {
  const tokens = tokenize(source)
  const errors: ParseError[] = []
  let pos = 0

  function peek(offset = 0): Token {
    return tokens[Math.min(pos + offset, tokens.length - 1)] as Token
  }

  function next(): Token {
    const t = tokens[pos] as Token
    pos++
    return t
  }

  function isValue(value: string): boolean {
    return peek().value === value
  }

  function expect(value: string): Token | null {
    if (isValue(value)) return next()
    errors.push({
      message: `expected '${value}' but found '${peek().value}'`,
      line: peek().line,
      column: peek().column,
    })
    return null
  }

  // Skip forward to a recovery point after a parse error.
  function recover(): void {
    while (peek().type !== 'eof' && !isValue(';') && !isValue('}')) next()
    if (isValue(';') || isValue('}')) next()
  }

  function parseRulesVersion(): RulesAST['rulesVersion'] {
    if (!isValue('rules_version')) return null
    const line = peek().line
    next() // rules_version
    expect('=')
    const valueToken = next() // the string token, e.g. '2'
    if (isValue(';')) next()
    return { value: valueToken.value, line }
  }

  function parsePath(): { tokens: Token[]; text: string } {
    const pathTokens: Token[] = []
    // A path runs until the block-opening `{` that is NOT part of `{name}`.
    // Rule: a `{` immediately preceded by `/` is part of the path;
    // any other `{` starts the block.
    while (peek().type !== 'eof') {
      if (isValue('{')) {
        const prev = pathTokens.at(-1)
        if (prev?.value === '/') {
          pathTokens.push(next())
          continue
        }
        break
      }
      pathTokens.push(next())
    }
    return { tokens: pathTokens, text: pathTokens.map((t) => t.value).join('') }
  }

  function parseMethods(): Method[] {
    const methods: Method[] = []
    while (peek().type !== 'eof' && !isValue(':')) {
      const t = next()
      if (t.type === 'identifier') methods.push(t.value as Method)
      if (isValue(',')) next()
    }
    return methods
  }

  function parseCondition(): Token[] {
    const condition: Token[] = []
    if (isValue('if')) next()
    while (peek().type !== 'eof' && !isValue(';')) {
      condition.push(next())
    }
    if (isValue(';')) next()
    return condition
  }

  function parseAllow(): AllowNode | null {
    const line = peek().line
    const column = peek().column
    next() // allow
    const methods = parseMethods()
    if (!expect(':')) {
      recover()
      return null
    }
    const condition = parseCondition()
    return { type: 'allow', methods, condition, line, column }
  }

  function parseFunctionBody(): Token[] {
    const body: Token[] = []
    expect('{')
    let depth = 1
    while (peek().type !== 'eof' && depth > 0) {
      if (isValue('{')) depth++
      if (isValue('}')) {
        depth--
        if (depth === 0) {
          next()
          break
        }
      }
      body.push(next())
    }
    return body
  }

  function parseFunction(): FunctionNode {
    const line = peek().line
    const column = peek().column
    next() // function
    const name = next().value
    expect('(')
    const params: string[] = []
    while (peek().type !== 'eof' && !isValue(')')) {
      const t = next()
      if (t.type === 'identifier') params.push(t.value)
    }
    expect(')')
    const body = parseFunctionBody()
    return { type: 'function', name, params, body, line, column }
  }

  function parseMatch(): MatchNode {
    const line = peek().line
    const column = peek().column
    next() // match
    const path = parsePath()
    const node: MatchNode = {
      type: 'match',
      pathTokens: path.tokens,
      pathText: path.text,
      matches: [],
      allows: [],
      functions: [],
      line,
      column,
    }
    if (!expect('{')) {
      recover()
      return node
    }
    parseBlockBody(node)
    return node
  }

  function parseBlockBody(container: {
    matches: MatchNode[]
    functions: FunctionNode[]
    allows?: AllowNode[]
  }): void {
    while (peek().type !== 'eof' && !isValue('}')) {
      if (isValue('match')) {
        container.matches.push(parseMatch())
      } else if (isValue('allow')) {
        const allow = parseAllow()
        if (allow && container.allows) {
          container.allows.push(allow)
        } else if (allow) {
          errors.push({
            message:
              "'allow' is not permitted directly under a service; nest it inside a match block",
            line: allow.line,
            column: allow.column,
          })
        }
      } else if (isValue('function')) {
        container.functions.push(parseFunction())
      } else {
        errors.push({
          message: `unexpected token '${peek().value}'`,
          line: peek().line,
          column: peek().column,
        })
        recover()
      }
    }
    expect('}')
  }

  function parseService(): ServiceNode {
    const line = peek().line
    const column = peek().column
    next() // service
    let name = next().value
    while (isValue('.')) {
      next()
      name += `.${next().value}`
    }
    const node: ServiceNode = { type: 'service', name, matches: [], functions: [], line, column }
    if (!expect('{')) {
      recover()
      return node
    }
    parseBlockBody(node)
    return node
  }

  const rulesVersion = parseRulesVersion()
  const services: ServiceNode[] = []

  while (peek().type !== 'eof') {
    if (isValue('service')) {
      services.push(parseService())
    } else {
      errors.push({
        message: `unexpected token '${peek().value}' at top level`,
        line: peek().line,
        column: peek().column,
      })
      recover()
    }
  }

  return { rulesVersion, services, errors }
}
