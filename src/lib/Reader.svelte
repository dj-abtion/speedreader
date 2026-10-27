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
    title = '',
    tokens,
    startIndex = 0,
    appearance,
    onAppearanceChange,
    onProgress = () => {},
    onFinish = () => {},
    onExit,
  }: {
    title?: string
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
  const LANGUAGES: Record<string, string> = {
    js: 'JavaScript', javascript: 'JavaScript', ts: 'TypeScript', typescript: 'TypeScript',
    jsx: 'JSX', tsx: 'TSX', py: 'Python', python: 'Python', rb: 'Ruby', ruby: 'Ruby',
    sh: 'Shell', bash: 'Shell', zsh: 'Shell', shell: 'Shell', console: 'Shell', json: 'JSON',
    yml: 'YAML', yaml: 'YAML', html: 'HTML', css: 'CSS', sql: 'SQL', go: 'Go', rs: 'Rust',
    rust: 'Rust', java: 'Java', kt: 'Kotlin', swift: 'Swift', c: 'C', cpp: 'C++', cs: 'C#',
    php: 'PHP', md: 'Markdown', markdown: 'Markdown', svelte: 'Svelte', diff: 'Diff',
  }
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
  // Changes made while paused are announced to screen readers, since no bubble shows then.
  let announcement = $state('')
  let settingsButton = $state<HTMLButtonElement>()
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
  let codeLanguage = $derived(
    code?.language ? (LANGUAGES[code.language.toLowerCase()] ?? code.language) : '',
  )
  let continueButton = $state<HTMLButtonElement>()
  // Playback stops by itself at a code block, so focus moves to the way on.
  $effect(() => {
    if (code && !playing) continueButton?.focus({ preventScroll: true })
  })
  // Before the first play there's nothing to resume, unless the text was already part read.
  let resuming = $derived(started || index > 0)
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
    announcement = ''
    started ||= player.playing
    // The settings panel would sit over the word, and its toggle is hidden while playing.
    if (player.playing) showAppearance = false
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
    if (!playing) {
      announcement = text
      return
    }
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

  function closeSettings() {
    showAppearance = false
    settingsButton?.focus()
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.metaKey || event.ctrlKey) return
    // Esc works from anywhere, including the settings' radio buttons: panel first, then the reader.
    if (event.key === 'Escape') {
      event.preventDefault()
      if (showAppearance) closeSettings()
      else exit()
      return
    }
    if (event.target instanceof HTMLInputElement) return
    // A focused button keeps its own Space; the stage is the one that means play.
    const target = event.target
    if (event.key === ' ' && target instanceof HTMLButtonElement && !target.classList.contains('stage')) return
    const actions: Record<string, () => void> = {
      ' ': toggle,
      ArrowLeft: back,
      ArrowRight: forward,
      ArrowUp: () => changeWpm(WPM_STEP),
      ArrowDown: () => changeWpm(-WPM_STEP),
      '1': () => setChunkSize(1),
      '2': () => setChunkSize(2),
      '3': () => setChunkSize(3),
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

<div
  class="reader"
  class:playing
  class:paused-for-code={!!code}
  class:settings-open={showAppearance && !code}
>
  <!-- Hidden chrome is inert while playing, so Tab can't land on controls nobody can see. -->
  <header class="top" inert={playing}>
    <button class="round" onclick={exit} aria-label="Back to library" title="Back to library (Esc)">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
    </button>
    <h1 class="title">{title}</h1>
    <button
      class="round"
      onclick={() => (showAppearance = !showAppearance)}
      bind:this={settingsButton}
      aria-label="Display settings"
      title="Display settings"
      aria-expanded={showAppearance}>Aa</button
    >
  </header>
  <p class="visually-hidden" role="status">
    {announcement ||
      (finished ? 'Done' : playing ? 'Reading' : code ? 'Paused for a code block' : started ? 'Paused' : '')}
  </p>

  {#if showAppearance && code}
    <div class="settings" inert={playing}>
      <AppearanceSettings {appearance} onChange={onAppearanceChange} />
    </div>
  {/if}

  {#if code}
    <section class="code" aria-labelledby="code-head">
      <h2 class="code-head" id="code-head">
        <span>Paused for code</span>
        <span>{codeLanguage ? `${codeLanguage} · ` : ''}{codeLines} {codeLines === 1 ? 'line' : 'lines'}</span>
      </h2>
      <!-- Long code scrolls, so the panel takes focus for keyboard scrolling. -->
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <pre tabindex="0" role="region" aria-label="Code"><code>{code.source}</code></pre>
      <button class="continue primary" onclick={toggle} bind:this={continueButton}>
        Continue reading
      </button>
      <button class="back-sentence" onclick={back}>Back a sentence</button>
    </section>
  {:else}
    <div class="stage-wrap">
      <!-- Space and the play button cover the keyboard, so the stage stays out of the tab order. -->
      <button
        class="stage"
        onclick={toggle}
        tabindex="-1"
        aria-label={playing ? 'Pause' : 'Play'}
        aria-describedby={playing ? undefined : 'reader-context'}
      >
        <WordDisplay {word} {appearance} />
        <p class="context" id="reader-context" aria-hidden={playing}>
          {#each context as token, i (contextOffset + i)}
            {@const current = contextOffset + i >= chunk.start && contextOffset + i < chunk.end}
            <!-- Svelte trims whitespace at the end of a block, so the separator must be explicit. -->
            <!-- eslint-disable-next-line svelte/no-useless-mustaches -->
            <span class:current>{token.text}</span>{' '}
          {/each}
        </p>
        <span class="hint" aria-hidden="true">
          <span class="touch">Tap anywhere to {finished ? 'read again' : resuming ? 'resume' : 'start'}</span>
          <span class="keys">
            <span><kbd>Space</kbd> to {finished ? 'read again' : resuming ? 'resume' : 'start'}</span>
            <span><kbd>←</kbd><kbd>→</kbd> sentence</span>
            <span><kbd>↑</kbd><kbd>↓</kbd> speed</span>
            <span><kbd>1</kbd>–<kbd>3</kbd> words</span>
          </span>
        </span>
      </button>

      {#if bubble}
        <div class="bubble" role="status">{bubble}</div>
      {/if}

      <!-- A sheet over the controls, so changes preview on the word itself without moving it. -->
      {#if showAppearance}
        <div class="settings floating" inert={playing}>
          <AppearanceSettings {appearance} onChange={onAppearanceChange} />
        </div>
      {/if}
    </div>
  {/if}

  <div class="controls" inert={playing || (showAppearance && !code)}>
    {#if !code}
      <div class="transport">
        <button class="round large" onclick={back} aria-label="Previous sentence" title="Previous sentence (←)">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" /></svg>
        </button>
        <button class="play" onclick={toggle} aria-label={playing ? 'Pause' : finished ? 'Restart' : 'Play'}>
          {#if playing}
            <svg viewBox="0 0 24 24" aria-hidden="true"><path class="fill" d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /></svg>
          {:else}
            <svg viewBox="0 0 24 24" aria-hidden="true"><path class="fill" d="M8 5.5v13l10.5-6.5z" /></svg>
          {/if}
        </button>
        <button class="round large" onclick={forward} aria-label="Next sentence" title="Next sentence (→)">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 17l5-5-5-5M6 17l5-5-5-5" /></svg>
        </button>
      </div>
    {/if}

    <!-- Speed and chunk size don't apply to code, so they wait until reading resumes. -->
    {#if !code}
      <div class="tuning">
        <div class="speed">
          <button
            class="step"
            onclick={() => changeWpm(-WPM_STEP)}
            disabled={wpm <= MIN_WPM}
            aria-label="Slower"
            title={wpm <= MIN_WPM ? `${MIN_WPM} wpm is the slowest` : undefined}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12" /></svg>
          </button>
          <span class="wpm">{wpm} <span class="unit">wpm</span></span>
          <button
            class="step"
            onclick={() => changeWpm(WPM_STEP)}
            disabled={wpm >= MAX_WPM}
            aria-label="Faster"
            title={wpm >= MAX_WPM ? `${MAX_WPM} wpm is the fastest` : undefined}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12M12 6v12" /></svg>
          </button>
        </div>
        <button
          class="chunk-size"
          onclick={cycleChunkSize}
          aria-label={`Words per flash: ${chunkSize}`}
          title="Words per flash (1, 2 or 3)"
        >
          {chunkSize} {chunkSize === 1 ? 'word' : 'words'}
        </button>
      </div>
    {/if}

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
    inert={playing || (showAppearance && !code)}
    aria-valuetext={`${percent}%`}
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
    gap: 1rem;
    padding: 1rem 1rem 0;
  }

  /* The text's title sits quietly between the two corner buttons. */
  .title {
    flex: 1;
    min-width: 0;
    margin: 0;
    overflow: hidden;
    color: var(--muted);
    font-size: 0.85rem;
    font-weight: 600;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .settings {
    display: flex;
    justify-content: center;
    padding: 1rem 1rem 0;
  }

  /* A sheet over the playback controls: opening it never moves or covers the word, so size and
     font changes preview on the word itself. */
  .settings.floating {
    position: fixed;
    bottom: calc(1rem + env(safe-area-inset-bottom));
    left: 50%;
    z-index: 1;
    width: min(28rem, calc(100% - 2rem));
    padding: 1rem;
    border: 1px solid var(--guide);
    border-radius: 1rem;
    background: var(--surface);
    box-sizing: border-box;
    transform: translateX(-50%);
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

  /* The sentence skips stay quiet so the play button is the one obvious action. */
  .round.large {
    width: 3.25rem;
    height: 3.25rem;
    border-color: transparent;
    color: var(--muted);
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

  .stage-wrap {
    position: relative;
    flex: 1;
    display: flex;
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

  .stage:focus-visible {
    outline: none;
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

  /* The panel takes only the room its code needs, centred where the word was. */
  .code {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
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
    gap: 1rem;
    margin: 0;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }

  /* Long code scrolls inside the panel so the controls stay put. */
  pre {
    flex: 0 1 auto;
    min-height: 0;
    max-height: 60dvh;
    margin: 0;
    padding: 1rem;
    overflow: auto;
    border-radius: 0.9rem;
    background: var(--surface);
    font: 0.9rem/1.5 ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
    tab-size: 2;
  }

  /* On a phone, wrapping beats a sideways scroll that's easy to miss. */
  @media (max-width: 40rem) {
    pre {
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
  }

  .back-sentence {
    align-self: center;
    min-height: 2.75rem;
    border-color: transparent;
    background: transparent;
    color: var(--muted);
    font-weight: 600;
  }

  .continue {
    min-height: 3.25rem;
    border: none;
    border-radius: 0.9rem;
    background: var(--accent);
    color: var(--on-accent);
    font-weight: 700;
  }

  .hint {
    margin-top: 1rem;
    font-size: 0.85rem;
    color: var(--muted);
    transition: opacity 150ms;
  }

  /* With a mouse and keyboard, the hint teaches the keys instead of the tap. */
  .keys {
    display: none;
  }

  @media (hover: hover) and (pointer: fine) {
    .touch {
      display: none;
    }

    .keys {
      display: inline-flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.35rem 1.25rem;
    }
  }

  kbd {
    display: inline-block;
    min-width: 1.2em;
    margin: 0 0.1em;
    padding: 0.05em 0.35em;
    border: 1px solid var(--guide);
    border-radius: 0.2rem;
    font: inherit;
    font-size: 0.8rem;
    text-align: center;
  }

  .keys > span {
    white-space: nowrap;
  }

  .playing .context,
  .playing .hint {
    opacity: 0;
  }

  /* Controls fade while reading and come back on pause; tapping the stage pauses. */
  .top,
  .settings,
  .controls,
  .progress {
    transition: opacity 300ms;
  }

  .playing .top,
  .playing .settings,
  .playing .controls {
    opacity: 0;
    pointer-events: none;
  }

  /* The settings sheet takes the controls' place while it's open. */
  .settings-open .controls,
  .settings-open .progress {
    opacity: 0;
    pointer-events: none;
  }

  /* While reading, progress stays as a faint line along the bottom edge. */
  .playing .progress {
    opacity: 0.4;
    pointer-events: none;
  }

  /* The confirmation shows just under the word, where the eyes already are. */
  .bubble {
    position: absolute;
    top: 50%;
    left: 40%;
    transform: translate(-50%, 2.5rem);
    padding: 0.5rem 1rem;
    border: 1px solid var(--guide);
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

  .paused-for-code .controls {
    padding-top: 0.5rem;
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
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 0.5rem 0.75rem;
  }

  .speed {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .step {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.75rem;
    height: 2.75rem;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: transparent;
  }

  /* The speed is a readout, not a button: plain text between its two steps. */
  .wpm {
    min-width: 5.5rem;
    text-align: center;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  .unit {
    color: var(--muted);
    font-weight: 400;
  }

  .chunk-size {
    min-width: 6.5rem;
    min-height: 2.75rem;
    padding: 0.5rem 0.9rem;
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

  /* A 4px line with a thumb-sized hit area, lifted clear of the home-indicator edge. */
  .progress {
    --line: 4px;
    display: block;
    width: 100%;
    height: 2.75rem;
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

  .playing .progress::-webkit-slider-thumb {
    opacity: 0;
  }

  .playing .progress::-moz-range-thumb {
    opacity: 0;
  }
</style>
