// Keeps the screen on during playback. The API is missing in some browsers, and requests can be
// rejected (e.g. low battery), so every failure is treated as "no wake lock".
export function createWakeLock() {
  let sentinel: WakeLockSentinel | null = null

  return {
    async acquire() {
      if (sentinel || !('wakeLock' in navigator)) return
      try {
        sentinel = await navigator.wakeLock.request('screen')
        sentinel.addEventListener('release', () => (sentinel = null))
      } catch {
        sentinel = null
      }
    },
    release() {
      sentinel?.release().catch(() => {})
      sentinel = null
    },
  }
}
