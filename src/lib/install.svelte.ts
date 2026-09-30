// Chromium hands over its install prompt once, possibly before the home screen is shown, so it's
// caught at startup and kept until the reader asks for it.
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'speedreader.installDismissed'

let deferredPrompt = $state<BeforeInstallPromptEvent | null>(null)
let installed = $state(false)
let dismissed = $state(false)

export function watchInstall(): void {
  installed =
    matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && navigator.standalone === true)
  dismissed = loadDismissed()
  addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt = event as BeforeInstallPromptEvent
  })
  addEventListener('appinstalled', () => {
    installed = true
    deferredPrompt = null
  })
}

// Safari on iOS and iPadOS has no install prompt to call, so its readers get the steps instead.
// iPads report themselves as Macs, but Macs have no touch screen.
const isApple =
  /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

export const installOffer = {
  get kind(): 'prompt' | 'steps' | null {
    if (installed || dismissed) return null
    if (deferredPrompt) return 'prompt'
    return isApple ? 'steps' : null
  },

  get canShareTo(): boolean {
    return /Android/.test(navigator.userAgent)
  },

  async install(): Promise<void> {
    const prompt = deferredPrompt
    if (!prompt) return
    // A prompt can only be shown once; Chromium offers a fresh one later if it's turned down.
    deferredPrompt = null
    await prompt.prompt()
    if ((await prompt.userChoice).outcome === 'accepted') installed = true
  },

  dismiss(): void {
    dismissed = true
    try {
      localStorage.setItem(DISMISSED_KEY, '1')
    } catch {
      // Not persisting is acceptable; the offer comes back next visit.
    }
  },
}

function loadDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}
