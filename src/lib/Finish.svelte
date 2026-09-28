<script lang="ts">
  import { onMount } from 'svelte'
  import { formatClock, formatCount, formatRemaining } from '../core/format'
  import { AVERAGE_WPM, savedMs } from '../core/stats'
  import type { LibraryDocument } from './library'
  import { loadWpm } from './settings'

  let {
    title,
    words,
    readingMs,
    next,
    onReadNext,
    onReadAgain,
    onLibrary,
  }: {
    title: string
    words: number
    readingMs: number
    next: LibraryDocument | null
    onReadNext: (doc: LibraryDocument) => void
    onReadAgain: () => void
    onLibrary: () => void
  } = $props()

  let primary: HTMLButtonElement | undefined = $state()

  function nextTimeLeft(doc: LibraryDocument): string {
    const wordsLeft = Math.max(doc.tokenCount - doc.position, 0)
    return formatRemaining((wordsLeft / loadWpm()) * 60_000)
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') onLibrary()
  }

  onMount(() => primary?.focus())
</script>

<svelte:window onkeydown={onKeydown} />

<div class="finish">
  <div class="done">
    <svg class="check" viewBox="0 0 512 512" aria-hidden="true">
      <rect x="248" y="40" width="16" height="72" rx="8" />
      <rect x="248" y="400" width="16" height="72" rx="8" />
      <path d="M130 262 L218 348 L382 176" pathLength="1" />
    </svg>
    <h1>Did read</h1>
    <p class="title">{title}</p>
  </div>

  <div class="stats">
    <dl>
      <div>
        <dt>words</dt>
        <dd>{formatCount(words)}</dd>
      </div>
      <div>
        <dt>reading time</dt>
        <dd>{formatClock(readingMs)}</dd>
      </div>
      <div class="saved">
        <dt>saved</dt>
        <dd>{formatClock(savedMs(words, readingMs))}</dd>
      </div>
    </dl>
    <p class="basis">Saved compared with reading it at {AVERAGE_WPM} wpm, the adult average.</p>
  </div>

  <div class="actions">
    {#if next}
      <div class="next">
        <span class="label">Next in library</span>
        <span class="next-title">{next.title}</span>
        <span class="meta">{formatCount(next.tokenCount)} words · {nextTimeLeft(next)}</span>
      </div>
      <button class="primary" bind:this={primary} onclick={() => next && onReadNext(next)}>Read next</button>
    {/if}
    <div class="secondary">
      {#if next}
        <button onclick={onLibrary}>Library</button>
      {:else}
        <button class="primary" bind:this={primary} onclick={onLibrary}>Library</button>
      {/if}
      <button onclick={onReadAgain}>Read again</button>
    </div>
  </div>
</div>

<style>
  .finish {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    width: min(28rem, 100%);
    min-height: 100dvh;
    padding: 2.5rem 1.25rem calc(1.75rem + env(safe-area-inset-bottom));
    box-sizing: border-box;
  }

  .done {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.25rem;
    text-align: center;
  }

  .check {
    width: 9rem;
    height: 9rem;
  }

  .check rect {
    fill: var(--muted);
  }

  .check path {
    fill: none;
    stroke: var(--accent);
    stroke-width: 54;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 1;
    animation: draw 600ms 150ms cubic-bezier(0.3, 0, 0.2, 1) both;
  }

  @keyframes draw {
    from {
      stroke-dashoffset: 1;
    }
    to {
      stroke-dashoffset: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .check path {
      animation: none;
    }
  }

  h1 {
    margin: 0;
    font-family: var(--display-font);
    font-size: 3.25rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1;
  }

  .title {
    max-width: 20rem;
    margin: 0;
    color: var(--muted);
    line-height: 1.45;
  }

  dl {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.5rem;
    margin: 0;
  }

  dl div {
    display: flex;
    flex-direction: column-reverse;
    gap: 0.25rem;
    padding: 0.9rem 0.75rem;
    border-radius: 0.9rem;
    background: var(--surface);
  }

  dt {
    font-size: 0.8rem;
    color: var(--muted);
  }

  dd {
    margin: 0;
    font-family: var(--display-font);
    font-size: 1.5rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .saved dd {
    color: var(--accent);
  }

  .basis {
    margin: 0.75rem 0 0;
    font-size: 0.8rem;
    color: var(--muted);
    text-align: center;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .next {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 0.9rem 1rem;
    border: 1px solid var(--guide);
    border-radius: 1rem;
  }

  .label {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }

  .next-title {
    font-weight: 600;
    line-height: 1.35;
  }

  .meta {
    font-size: 0.85rem;
    color: var(--muted);
  }

  .secondary {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.6rem;
  }

  button {
    min-height: 3rem;
    border-radius: 0.9rem;
    font-weight: 600;
  }

  .primary {
    min-height: 3.5rem;
    border: none;
    background: var(--accent);
    color: var(--on-accent);
    font-weight: 700;
  }
</style>
