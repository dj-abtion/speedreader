<script lang="ts">
  import { onDestroy, onMount, untrack } from 'svelte'
  import { chunkText } from '../core/chunk'
  import { formatRemaining } from '../core/format'
  import { sentenceEnd, sentenceStart } from '../core/navigation'
  import { MAX_CHUNK_SIZE, MAX_WPM, MIN_WPM, Player } from '../core/player'
  import type { Token } from '../core/tokenize'
  import type { Appearance } from './appearance'
  import AppearanceSettings from './AppearanceSettings.svelte'
  import { loadChunkSize, loadWpm, saveChunkSize, saveWpm } from './settings'
  import { createWakeLock } from './wakeLock'
  import WordDisplay from './WordDisplay.svelte'

  let {
    tokens,
    startIndex = 0,
    appearance,
    onAppearanceChange,
    onProgress = () => {},
    onFinish = () => {},
    onExit,
  }: {
    tokens: Token[]
    startIndex?: number
    appearance: Appearance
    onAppearanceChange: (appearance: Appearance) => void
    // Reading time is the time spent playing since this reader opened.
    onProgress?: (index: number, readingMs: number) => void
    onFinish?: (readingMs: number) => void
    onExit: () => void
  } = $props()

  const WPM_STEP = 25
  const SAVE_INTERVAL_MS = 3000

  let index = $state(0)
  let playing = $state(false)
  let finished = $state(false)
  const initialWpm = loadWpm()
  let wpm = $state(initialWpm)
  const initialChunkSize = loadChunkSize()
  let chunkSize = $state(initialChunkSize)
  let remaining = $state(0)
  let showAppearance = $state(false)

  let lastSavedAt = 0
  let playedMs = 0
  let playingSince: number | null = null

  function readingMs(): number {
    return playedMs + (playingSince === null ? 0 : performance.now() - playingSince)
  }

  // Tokens and start position are fixed for the lifetime of this component; a new text
  // mounts a new Reader.
  const initial = untrack(() => ({ tokens, position: startIndex }))

  const wakeLock = createWakeLock()
  const player = new Player({
    ...initial,
    wpm: initialWpm,
    chunkSize: initialChunkSize,
    onTick: (i) => {
      index = i
      chunk = player.chunk
      remaining = player.remainingMs
      if (Date.now() - lastSavedAt >= SAVE_INTERVAL_MS) saveProgress()
    },
    onEnd: () => {
      finished = true
      sync()
      onFinish(readingMs())
    },
  })

  let chunk = $state(player.chunk)
  let word = $derived(chunkText(tokens, chunk))
  let context = $derived(
    tokens.slice(sentenceStart(tokens, index), sentenceEnd(tokens, index) + 1),
  )
  let contextOffset = $derived(sentenceStart(tokens, index))

  function sync() {
    index = player.index
    chunk = player.chunk
    chunkSize = player.chunkSize
    playing = player.playing
    wpm = player.wpm
    remaining = player.remainingMs
    if (playing) {
      playingSince ??= performance.now()
      wakeLock.acquire()
    } else {
      if (playingSince !== null) playedMs += performance.now() - playingSince
      playingSince = null
      wakeLock.release()
      saveProgress()
    }
  }

  // A finished text saves its last token so the library shows it as finished, whichever chunk
  // size it was read at.
  function saveProgress() {
    lastSavedAt = Date.now()
    onProgress(finished ? tokens.length - 1 : player.index, readingMs())
  }

  function toggle() {
    if (finished && !player.playing) {
      player.seek(0)
      finished = false
    }
    player.toggle()
    sync()
  }

  function pause() {
    player.pause()
    sync()
  }

  function back() {
    player.back()
    finished = false
    sync()
  }

  function forward() {
    player.forward()
    sync()
  }

  function changeWpm(delta: number) {
    player.setWpm(player.wpm + delta)
    saveWpm(player.wpm)
    sync()
  }

  function setChunkSize(size: number) {
    player.setChunkSize(size)
    saveChunkSize(player.chunkSize)
    sync()
  }

  function cycleChunkSize() {
    setChunkSize((player.chunkSize % MAX_CHUNK_SIZE) + 1)
  }

  function seek(event: Event) {
    player.seek(Number((event.currentTarget as HTMLInputElement).value))
    finished = false
    sync()
  }

  function exit() {
    pause()
    onExit()
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.target instanceof HTMLInputElement || event.metaKey || event.ctrlKey) return
    const actions: Record<string, () => void> = {
      ' ': toggle,
      ArrowLeft: back,
      ArrowRight: forward,
      ArrowUp: () => changeWpm(WPM_STEP),
      ArrowDown: () => changeWpm(-WPM_STEP),
      '1': () => setChunkSize(1),
      '2': () => setChunkSize(2),
      '3': () => setChunkSize(3),
      Escape: exit,
    }
    const action = actions[event.key]
    if (!action) return
    event.preventDefault()
    action()
  }

  function onVisibilityChange() {
    if (document.hidden) pause()
  }

  onMount(() => {
    finished = player.index > 0 && player.atLastChunk
    sync()
    document.addEventListener('visibilitychange', onVisibilityChange)
  })

  onDestroy(() => {
    player.pause()
    saveProgress()
    wakeLock.release()
    document.removeEventListener('visibilitychange', onVisibilityChange)
  })
</script>

<svelte:window onkeydown={onKeydown} />

<div class="reader" class:playing>
  <button class="stage" onclick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
    <WordDisplay {word} {appearance} />
    <p class="context" aria-hidden={playing}>
      {#each context as token, i (contextOffset + i)}
        {@const current = contextOffset + i >= chunk.start && contextOffset + i < chunk.end}
        <!-- Svelte trims whitespace at the end of a block, so the separator must be explicit. -->
        <!-- eslint-disable-next-line svelte/no-useless-mustaches -->
        <span class:current>{token.text}</span>{' '}
      {/each}
    </p>
  </button>

  <div class="controls">
    <input
      class="progress"
      type="range"
      min="0"
      max={Math.max(tokens.length - 1, 0)}
      value={index}
      oninput={seek}
      aria-label="Position"
    />
    {#if showAppearance}
      <AppearanceSettings {appearance} onChange={onAppearanceChange} />
    {/if}
    <div class="row">
      <button onclick={exit} aria-label="New text">✕</button>
      <span class="remaining">{finished ? 'Done' : formatRemaining(remaining)}</span>
      <div class="group">
        <button onclick={back} aria-label="Previous sentence">⟲</button>
        <button class="play" onclick={toggle}>{playing ? 'Pause' : finished ? 'Restart' : 'Play'}</button>
        <button onclick={forward} aria-label="Next sentence">⟳</button>
      </div>
      <div class="group">
        <button onclick={() => changeWpm(-WPM_STEP)} disabled={wpm <= MIN_WPM} aria-label="Slower">−</button>
        <span class="wpm">{wpm} wpm</span>
        <button onclick={() => changeWpm(WPM_STEP)} disabled={wpm >= MAX_WPM} aria-label="Faster">+</button>
      </div>
      <button class="chunk-size" onclick={cycleChunkSize} aria-label="Words per flash">
        {chunkSize} {chunkSize === 1 ? 'word' : 'words'}
      </button>
      <button
        onclick={() => (showAppearance = !showAppearance)}
        aria-label="Display settings"
        aria-expanded={showAppearance}>Aa</button
      >
    </div>
  </div>
</div>

<style>
  .reader {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 100dvh;
  }

  .stage {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 1rem;
    border: none;
    border-radius: 0;
    background: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .context {
    max-width: 40rem;
    min-height: 4.5em;
    margin: 1rem 0 0;
    color: var(--muted);
    font-family: var(--reading-font);
    line-height: 1.5;
    transition: opacity 150ms;
  }

  .context .current {
    color: var(--text);
    text-decoration: underline;
    text-decoration-color: var(--accent);
  }

  .playing .context {
    opacity: 0;
  }

  .controls {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom));
    transition: opacity 300ms;
  }

  /* Controls fade while reading and come back on pause; tapping the stage pauses. */
  .playing .controls {
    opacity: 0;
    pointer-events: none;
  }

  .progress {
    width: 100%;
    accent-color: var(--accent);
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .group {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .remaining,
  .wpm {
    font-variant-numeric: tabular-nums;
    color: var(--muted);
  }

  .wpm {
    min-width: 5.5em;
    text-align: center;
  }

  .play,
  .chunk-size {
    min-width: 5.5em;
  }
</style>
