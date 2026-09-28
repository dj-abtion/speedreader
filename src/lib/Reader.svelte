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
  let started = $state(false)
  let bubble = $state('')
  let bubbleTimer: ReturnType<typeof setTimeout> | undefined
  let percent = $derived(finished ? 100 : Math.floor((index / Math.max(tokens.length, 1)) * 100))

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
    onStop: sync,
    onEnd: () => {
      finished = true
      sync()
      onFinish(readingMs())
    },
  })

  let chunk = $state(player.chunk)
  let word = $derived(chunkText(tokens, chunk))
  let code = $derived(tokens[chunk.start]?.code)
  let codeLines = $derived(code ? code.source.split('\n').length : 0)
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
      bubble = ''
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
    started ||= player.playing
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

  // The controls are hidden while playing, so a change made from the keyboard is confirmed in a
  // brief bubble instead.
  function confirmChange(text: string) {
    if (!playing) return
    bubble = text
    clearTimeout(bubbleTimer)
    bubbleTimer = setTimeout(() => (bubble = ''), 900)
  }

  function changeWpm(delta: number) {
    player.setWpm(player.wpm + delta)
    saveWpm(player.wpm)
    sync()
    confirmChange(`${wpm} wpm`)
  }

  function setChunkSize(size: number) {
    player.setChunkSize(size)
    saveChunkSize(player.chunkSize)
    sync()
    confirmChange(`${chunkSize} ${chunkSize === 1 ? 'word' : 'words'}`)
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
    clearTimeout(bubbleTimer)
    player.pause()
    saveProgress()
    wakeLock.release()
    document.removeEventListener('visibilitychange', onVisibilityChange)
  })
</script>

<svelte:window onkeydown={onKeydown} />

<div class="reader" class:playing>
  <header class="top">
    <button class="round" onclick={exit} aria-label="Back to library">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
    </button>
    <span class="state">{finished ? 'Done' : started ? 'Paused' : ''}</span>
    <button
      class="round"
      onclick={() => (showAppearance = !showAppearance)}
      aria-label="Display settings"
      aria-expanded={showAppearance}>Aa</button
    >
  </header>

  {#if showAppearance}
    <div class="appearance">
      <AppearanceSettings {appearance} onChange={onAppearanceChange} />
    </div>
  {/if}

  {#if code}
    <section class="code" aria-label="Code block">
      <div class="code-head">
        <span>{code.language || 'Code'}</span>
        <span>{codeLines} {codeLines === 1 ? 'line' : 'lines'}</span>
      </div>
      <pre><code>{code.source}</code></pre>
      <button class="continue" onclick={toggle}>Continue reading</button>
    </section>
  {:else}
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
      <span class="hint" aria-hidden="true">
        {finished ? 'Tap anywhere to read again' : started ? 'Tap anywhere to resume' : 'Tap anywhere to start'}
      </span>
    </button>
  {/if}

  {#if bubble}
    <div class="bubble" role="status">{bubble}</div>
  {/if}

  <div class="controls">
    <div class="transport">
      <button class="round large" onclick={back} aria-label="Previous sentence">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" /></svg>
      </button>
      <button class="play" onclick={toggle} aria-label={playing ? 'Pause' : finished ? 'Restart' : 'Play'}>
        {#if playing}
          <svg viewBox="0 0 24 24" aria-hidden="true"><path class="fill" d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /></svg>
        {:else}
          <svg viewBox="0 0 24 24" aria-hidden="true"><path class="fill" d="M8 5.5v13l10.5-6.5z" /></svg>
        {/if}
      </button>
      <button class="round large" onclick={forward} aria-label="Next sentence">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 17l5-5-5-5M6 17l5-5-5-5" /></svg>
      </button>
    </div>

    <div class="tuning">
      <div class="speed">
        <button class="step" onclick={() => changeWpm(-WPM_STEP)} disabled={wpm <= MIN_WPM} aria-label="Slower">−</button>
        <span class="wpm">{wpm} wpm</span>
        <button class="step" onclick={() => changeWpm(WPM_STEP)} disabled={wpm >= MAX_WPM} aria-label="Faster">+</button>
      </div>
      <button class="chunk-size" onclick={cycleChunkSize} aria-label="Words per flash">
        {chunkSize} {chunkSize === 1 ? 'word' : 'words'}
      </button>
    </div>

    <div class="status">
      <span>{percent}%</span>
      <span class="remaining">{finished ? 'Done' : formatRemaining(remaining)}</span>
    </div>
  </div>

  <input
    class="progress"
    type="range"
    min="0"
    max={Math.max(tokens.length - 1, 0)}
    value={index}
    oninput={seek}
    aria-label="Position"
    style:--filled={`${percent}%`}
  />
</div>

<style>
  .reader {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 100dvh;
    padding-top: env(safe-area-inset-top);
    box-sizing: border-box;
  }

  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1rem 0;
  }

  .state {
    font-size: 0.85rem;
    color: var(--muted);
  }

  .appearance {
    display: flex;
    justify-content: center;
    padding: 1rem 1rem 0;
  }

  .round {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.75rem;
    height: 2.75rem;
    padding: 0;
    border-radius: 50%;
    background: transparent;
    font-weight: 600;
  }

  .round.large {
    width: 3.25rem;
    height: 3.25rem;
    background: var(--surface);
  }

  svg {
    width: 1.25rem;
    height: 1.25rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  svg .fill {
    fill: currentColor;
    stroke: none;
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

  .code {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: min(44rem, 100%);
    min-height: 0;
    align-self: center;
    padding: 1.5rem 1rem 1rem;
    box-sizing: border-box;
  }

  .code-head {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }

  /* Long code scrolls inside the panel so the controls stay put. */
  pre {
    flex: 1 1 0;
    min-height: 8rem;
    margin: 0;
    padding: 1rem;
    overflow: auto;
    border-radius: 0.9rem;
    background: var(--surface);
    font: 0.9rem/1.5 ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
    tab-size: 2;
  }

  .continue {
    min-height: 3rem;
    border-radius: 0.9rem;
    font-weight: 600;
  }

  .hint {
    margin-top: 1rem;
    font-size: 0.85rem;
    color: var(--muted);
    transition: opacity 150ms;
  }

  .playing .context,
  .playing .hint {
    opacity: 0;
  }

  /* Controls fade while reading and come back on pause; tapping the stage pauses. */
  .top,
  .controls,
  .progress {
    transition: opacity 300ms;
  }

  .playing .top,
  .playing .controls,
  .playing .progress {
    opacity: 0;
    pointer-events: none;
  }

  .bubble {
    position: absolute;
    left: 50%;
    bottom: calc(6rem + env(safe-area-inset-bottom));
    transform: translateX(-50%);
    padding: 0.5rem 1rem;
    border-radius: 999px;
    background: var(--surface);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    pointer-events: none;
    animation: pop 900ms ease both;
  }

  @keyframes pop {
    0% {
      opacity: 0;
    }
    15%,
    75% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .bubble {
      animation: none;
    }
  }

  .controls {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: min(28rem, 100%);
    align-self: center;
    padding: 0 1rem 1rem;
    box-sizing: border-box;
  }

  .transport {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.75rem;
  }

  .play {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 4.5rem;
    height: 4.5rem;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: var(--accent);
    color: var(--on-accent);
  }

  .play svg {
    width: 1.75rem;
    height: 1.75rem;
  }

  .tuning {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
  }

  .speed {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .step {
    width: 2.75rem;
    height: 2.75rem;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: transparent;
    font-size: 1.35rem;
    font-weight: 600;
  }

  .wpm,
  .chunk-size {
    min-width: 6.5rem;
    padding: 0.5rem 0.9rem;
    border: none;
    border-radius: 999px;
    background: var(--surface);
    text-align: center;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  .status {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }

  /* A thin line along the bottom edge, with a taller invisible hit area for dragging. */
  .progress {
    --line: 4px;
    width: 100%;
    height: 1.5rem;
    margin: 0 0 env(safe-area-inset-bottom);
    background: transparent;
    appearance: none;
    cursor: pointer;
  }

  .progress::-webkit-slider-runnable-track {
    height: var(--line);
    background: linear-gradient(to right, var(--accent) var(--filled), var(--guide) var(--filled));
  }

  .progress::-moz-range-track {
    height: var(--line);
    background: linear-gradient(to right, var(--accent) var(--filled), var(--guide) var(--filled));
  }

  .progress::-webkit-slider-thumb {
    width: 14px;
    height: 14px;
    margin-top: -5px;
    border-radius: 50%;
    background: var(--accent);
    appearance: none;
  }

  .progress::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border: none;
    border-radius: 50%;
    background: var(--accent);
  }
</style>
