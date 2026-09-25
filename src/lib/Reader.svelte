<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import { formatRemaining } from '../core/format'
  import { sentenceEnd, sentenceStart } from '../core/navigation'
  import { MAX_WPM, MIN_WPM, Player } from '../core/player'
  import type { Token } from '../core/tokenize'
  import { loadWpm, saveWpm } from './settings'
  import { createWakeLock } from './wakeLock'
  import WordDisplay from './WordDisplay.svelte'

  let { tokens, onExit }: { tokens: Token[]; onExit: () => void } = $props()

  const WPM_STEP = 25

  let index = $state(0)
  let playing = $state(false)
  let finished = $state(false)
  const initialWpm = loadWpm()
  let wpm = $state(initialWpm)
  let remaining = $state(0)

  const wakeLock = createWakeLock()
  const player = new Player({
    // Tokens are fixed for the lifetime of this component; a new text mounts a new Reader.
    // svelte-ignore state_referenced_locally
    tokens,
    wpm: initialWpm,
    onTick: (i) => {
      index = i
      remaining = player.remainingMs
    },
    onEnd: () => {
      finished = true
      sync()
    },
  })

  let context = $derived(
    tokens.slice(sentenceStart(tokens, index), sentenceEnd(tokens, index) + 1),
  )
  let contextOffset = $derived(sentenceStart(tokens, index))

  function sync() {
    index = player.index
    playing = player.playing
    wpm = player.wpm
    remaining = player.remainingMs
    if (playing) wakeLock.acquire()
    else wakeLock.release()
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
    sync()
    document.addEventListener('visibilitychange', onVisibilityChange)
  })

  onDestroy(() => {
    player.pause()
    wakeLock.release()
    document.removeEventListener('visibilitychange', onVisibilityChange)
  })
</script>

<svelte:window onkeydown={onKeydown} />

<div class="reader" class:playing>
  <button class="stage" onclick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
    <WordDisplay word={tokens[index]?.text ?? ''} />
    <p class="context" aria-hidden={playing}>
      {#each context as token, i (contextOffset + i)}
        <span class:current={contextOffset + i === index}>{token.text}</span>{' '}
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

  .play {
    min-width: 5.5em;
  }
</style>
