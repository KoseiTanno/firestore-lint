import type { Rule } from '../types.js'
import { noAuthOnlyRead } from './no-auth-only-read.js'
import { noPublicRead } from './no-public-read.js'
import { requireAuthCheck } from './require-auth-check.js'

export const rules: Rule[] = [noPublicRead, requireAuthCheck, noAuthOnlyRead]
