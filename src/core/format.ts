export function formatRemaining(ms: number): string {
  if (ms < 60_000) return `${Math.ceil(ms / 1000)} s left`
  const minutes = Math.ceil(ms / 60_000)
  if (minutes < 60) return `${minutes} min left`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours} h left` : `${hours} h ${rest} min left`
}

export function formatDuration(ms: number): string {
  const seconds = Math.round(ms / 1000)
  if (seconds < 60) return `${seconds} s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return seconds % 60 === 0 ? `${minutes} min` : `${minutes} min ${seconds % 60} s`
  const hours = Math.floor(minutes / 60)
  return minutes % 60 === 0 ? `${hours} h` : `${hours} h ${minutes % 60} min`
}

export function formatClock(ms: number): string {
  const seconds = Math.round(ms / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

export function formatCount(count: number): string {
  return count.toLocaleString('en-US')
}
