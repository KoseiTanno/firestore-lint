import { execFile } from 'node:child_process'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { describe, expect, it } from 'vitest'

const run = promisify(execFile)

async function cli(args: string[]) {
  try {
    const { stdout, stderr } = await run('node', ['dist/cli.mjs', ...args])
    return { code: 0, stdout, stderr }
  } catch (e) {
    const err = e as { code: number; stdout: string; stderr: string }
    return { code: err.code, stdout: err.stdout, stderr: err.stderr }
  }
}

async function fixture(contents: string) {
  const dir = await mkdtemp(join(tmpdir(), 'firestore-lint-'))
  const file = join(dir, 'firestore.rules')
  await writeFile(file, contents)
  return file
}

const CLEAN = `rules_version = '2';
service cloud.firestore {
  match /databases/{d}/documents {
    match /users/{userId} {
      allow read, create, update: if request.auth.uid == userId;
    }
  }
}`

const OPEN = `rules_version = '2';
service cloud.firestore {
  match /databases/{d}/documents {
    match /users/{userId} { allow read: if true; }
  }
}`

describe('cli', () => {
  it('exits 0 on a clean file', async () => {
    const { code } = await cli([await fixture(CLEAN)])
    expect(code).toBe(0)
  })

  it('exits 1 when an error is found', async () => {
    const { code, stdout } = await cli([await fixture(OPEN)])
    expect(code).toBe(1)
    expect(stdout).toContain('no-public-read')
  })

  it('exits 2 when the file does not exist', async () => {
    const { code, stderr } = await cli(['does-not-exist.rules'])
    expect(code).toBe(2)
    expect(stderr).toContain('does-not-exist.rules')
  })

  it('exits 2 on an unknown option', async () => {
    const { code } = await cli(['--nope', await fixture(CLEAN)])
    expect(code).toBe(2)
  })

  it('emits valid json with --format json', async () => {
    const { stdout } = await cli([await fixture(OPEN), '--format', 'json'])
    const parsed = JSON.parse(stdout)
    expect(parsed[0].diagnostics[0].ruleId).toBe('no-public-read')
  })

  it('keeps stdout clean when a file is missing', async () => {
    const { stdout } = await cli(['missing.rules'])
    expect(stdout.trim()).toBe('')
  })

  it('fails on warnings with --max-warnings 0', async () => {
    const warnSrc = CLEAN.replace(
      'allow read, create, update: if request.auth.uid == userId;',
      'allow read, write: if request.auth.uid == userId;',
    )
    const { code } = await cli([await fixture(warnSrc), '--max-warnings', '0'])
    expect(code).toBe(1)
  })

  it('prints the version from package.json', async () => {
    const pkg = JSON.parse(await readFile('package.json', 'utf8'))
    const { stdout, code } = await cli(['--version'])
    expect(code).toBe(0)
    expect(stdout.trim()).toBe(pkg.version)
  })
})
