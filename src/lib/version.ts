export interface BuildInfo {
  commit: string
  date: string
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const SHORT_COMMIT_LENGTH = 7

export const REPOSITORY_URL = 'https://github.com/dj-abtion/speedreader'

export const buildInfo: BuildInfo = {
  commit: import.meta.env.VITE_APP_COMMIT ?? '',
  date: import.meta.env.VITE_APP_COMMIT_DATE ?? '',
}

// Uses the date as written in the commit timestamp rather than converting time zones, so the
// label matches what GitHub shows for the commit.
export function formatVersion({ commit, date }: BuildInfo): string {
  if (!commit) return 'Development build'
  const label = `Version ${commit.slice(0, SHORT_COMMIT_LENGTH)}`
  const match = /^(\d{4})-(\d{2})-(\d{2})T/.exec(date)
  if (!match) return label
  const [, year, month, day] = match
  return `${label} · ${Number(day)} ${MONTHS[Number(month) - 1]} ${year}`
}
