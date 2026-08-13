import type { Diagnostic } from '../types.js'

export function formatJson(results: { filePath: string; diagnostics: Diagnostic[] }[]): string {
  return JSON.stringify(results, null, 2)
}
