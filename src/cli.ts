#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import { lint } from './linter.js'
import { formatJson } from './reporters/json.js'
import { formatPretty } from './reporters/pretty.js'
import { rules } from './rules/index.js'
import type { Diagnostic } from './types.js'

const VERSION = '0.0.0'

function printHelp(): void {
  process.stdout.write(`firestore-lint [options] <file...>

Options:
  --format <pretty|json>   Output format (default: pretty)
  --max-warnings <n>       Fail if warnings exceed this count
  --help                   Show this help message
  --version                Show the version number
`)
}

async function run(argv: string[]): Promise<number> {
  let parsed: ReturnType<typeof parseArgs>
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        format: { type: 'string', default: 'pretty' },
        'max-warnings': { type: 'string' },
        help: { type: 'boolean', default: false },
        version: { type: 'boolean', default: false },
      },
    })
  } catch (e) {
    process.stderr.write(`${(e as Error).message}\n`)
    return 2
  }

  const { values, positionals } = parsed

  if (values.help) {
    printHelp()
    return 0
  }

  if (values.version) {
    process.stdout.write(`${VERSION}\n`)
    return 0
  }

  if (values.format !== 'pretty' && values.format !== 'json') {
    process.stderr.write(`Unknown --format value: ${values.format}\n`)
    return 2
  }

  if (positionals.length === 0) {
    process.stderr.write('No files specified.\n')
    return 2
  }

  const maxWarnings =
    values['max-warnings'] !== undefined ? Number(values['max-warnings']) : undefined

  const results: { filePath: string; diagnostics: Diagnostic[] }[] = []

  for (const filePath of positionals) {
    let source: string
    try {
      source = await readFile(filePath, 'utf8')
    } catch {
      process.stderr.write(`Could not read file: ${filePath}\n`)
      return 2
    }
    const diagnostics = lint(source, { rules })
    results.push({ filePath, diagnostics })
  }

  const allDiagnostics = results.flatMap((r) => r.diagnostics)
  const errorCount = allDiagnostics.filter((d) => d.severity === 'error').length
  const warnCount = allDiagnostics.filter((d) => d.severity === 'warn').length

  if (values.format === 'json') {
    process.stdout.write(`${formatJson(results)}\n`)
  } else {
    const color = process.env.NO_COLOR === undefined && process.stdout.isTTY === true
    for (const r of results) {
      process.stdout.write(formatPretty(r.diagnostics, '', r.filePath, { color }))
    }
  }

  if (errorCount > 0) return 1
  if (maxWarnings !== undefined && warnCount > maxWarnings) return 1
  return 0
}

run(process.argv.slice(2)).then((code) => {
  process.exitCode = code
})
