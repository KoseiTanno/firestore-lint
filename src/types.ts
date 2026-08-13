export type TokenType =
  | 'identifier' // match, allow, if, request, users ...
  | 'number' // 2026, 10
  | 'string' // '2' "text"
  | 'punctuation' // { } ( ) [ ] , ; :
  | 'operator' // / . = == != < > <= >= && || ! $ +-*%
  | 'eof'

export interface Token {
  type: TokenType
  value: string
  line: number // 1始まり
  column: number // 1始まり
}

export type Method = 'read' | 'write' | 'create' | 'update' | 'delete' | 'get' | 'list'

export interface AllowNode {
  type: 'allow'
  methods: Method[]
  condition: Token[] // 条件式は解釈せずトークン列のまま保持する
  line: number
  column: number
}

export interface FunctionNode {
  type: 'function'
  name: string
  params: string[]
  body: Token[] // 関数本体もトークン列のまま
  line: number
  column: number
}

export interface MatchNode {
  type: 'match'
  pathTokens: Token[]
  pathText: string // 復元した文字列。例: "/users/{userId}"
  matches: MatchNode[] // ネストしたmatch
  allows: AllowNode[]
  functions: FunctionNode[]
  line: number
  column: number
}

export interface ServiceNode {
  type: 'service'
  name: string // "cloud.firestore" / "firebase.storage"
  matches: MatchNode[]
  functions: FunctionNode[]
  line: number
  column: number
}

export interface ParseError {
  message: string
  line: number
  column: number
}

export interface RulesAST {
  rulesVersion: { value: string; line: number } | null
  services: ServiceNode[]
  errors: ParseError[] // パースエラーはthrowせずここに溜める
}

export type Severity = 'error' | 'warn' | 'info'

export interface Diagnostic {
  ruleId: string
  severity: Severity
  message: string
  line: number
  column: number
}

export interface RuleContext {
  source: string
  functions: Map<string, FunctionNode> // ファイル全体の関数名 → 定義
  now: Date // テストで固定するため注入可能にする
}

export interface Rule {
  id: string
  severity: Severity
  check(ast: RulesAST, ctx: RuleContext): Diagnostic[]
}
