export function formatRemaining(ms: number): string {
  if (ms < 60_000) return `${Math.ceil(ms / 1000)} s left`
  const minutes = Math.ceil(ms / 60_000)
  if (minutes < 60) return `${minutes} min left`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours} h left` : `${hours} h ${rest} min left`
}
