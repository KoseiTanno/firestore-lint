import type { Rule } from '../types.js'
import { noPublicRead } from './no-public-read.js'

export const rules: Rule[] = [noPublicRead]
