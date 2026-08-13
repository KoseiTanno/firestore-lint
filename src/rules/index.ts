import type { Rule } from '../types.js'
import { limitGetCalls } from './limit-get-calls.js'
import { noAuthOnlyRead } from './no-auth-only-read.js'
import { noExpiredTestMode } from './no-expired-test-mode.js'
import { noPublicRead } from './no-public-read.js'
import { noWildcardWrite } from './no-wildcard-write.js'
import { preferGranularWrite } from './prefer-granular-write.js'
import { requireAuthCheck } from './require-auth-check.js'
import { requireRulesVersion } from './require-rules-version.js'

export const rules: Rule[] = [
  noPublicRead,
  requireAuthCheck,
  noAuthOnlyRead,
  noWildcardWrite,
  noExpiredTestMode,
  limitGetCalls,
  preferGranularWrite,
  requireRulesVersion,
]
