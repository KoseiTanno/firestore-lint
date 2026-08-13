import type { Diagnostic, Severity } from '../types.js'

export interface PrettyOptions {
  color: boolean
}

const RESET = '\x1b[0m'
const DIM = '\x1b[2m'
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'

function colorFor(severity: Severity): string {
  if (severity === 'error') return RED
  if (severity === 'warn') return YELLOW
  return DIM
}

export function formatPretty(
  diagnostics: Diagnostic[],
  _source: string,
  filePath: string,
  options: PrettyOptions,
): string {
  const wrap = (code: string, text: string) => (options.color ? `${code}${text}${RESET}` : text)

  if (diagnostics.length === 0) {
    return `${filePath}\n  ${wrap(DIM, 'No problems found.')}\n`
  }

  const lines: string[] = [filePath]
  let errorCount = 0
  let warnCount = 0

  for (const d of diagnostics) {
    if (d.severity === 'error') errorCount++
    if (d.severity === 'warn') warnCount++

    const position = `${d.line}:${d.column}`.padEnd(8)
    const severity = wrap(colorFor(d.severity), d.severity.padEnd(6))
    lines.push(`  ${position} ${severity} ${d.message}  ${wrap(DIM, d.ruleId)}`)
  }

  const parts: string[] = []
  if (errorCount > 0) parts.push(`${errorCount} error${errorCount === 1 ? '' : 's'}`)
  if (warnCount > 0) parts.push(`${warnCount} warning${warnCount === 1 ? '' : 's'}`)
  lines.push('')
  lines.push(`${diagnostics.length} problems (${parts.join(', ')})`)

  return `${lines.join('\n')}\n`
}
