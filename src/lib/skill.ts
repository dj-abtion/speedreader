import { REPOSITORY_URL } from './version'

// A fragment rather than a path, so the guide can be linked to without the host serving extra
// routes. Reader links use #t=…, which this can't be mistaken for.
export const GUIDE_HASH = '#claude'

export const SKILL_ZIP_URL = `${REPOSITORY_URL}/releases/download/speedread-skill/speedread.zip`

export const SKILL_README_URL = `${REPOSITORY_URL}#speedread-skill-for-claude-code`

export const CLI_COMMANDS = [
  'claude plugin marketplace add dj-abtion/speedreader',
  'claude plugin install didread@speedreader',
]
