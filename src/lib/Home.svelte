<script lang="ts">
  import { readableText, textFromFile, type NewDocument } from '../core/document'
  import { formatCount, formatDuration, formatRemaining } from '../core/format'
  import { payloadFromLink } from '../core/link'
  import { parseShare } from '../core/share'
  import type { Appearance } from './appearance'
  import AppearanceSettings from './AppearanceSettings.svelte'
  import { isFinished, type LibraryDocument } from './library'
  import { loadWpm } from './settings'
  import { buildInfo, formatVersion, REPOSITORY_URL } from './version'

  let {
    documents,
    storageAvailable,
    notice = '',
    summary,
    appearance,
    onAppearanceChange,
    onAdd,
    onOpenLink,
    onOpen,
    onRemove,
  }: {
    documents: LibraryDocument[]
    storageAvailable: boolean
    notice?: string
    summary: { savedMs: number; count: number }
    appearance: Appearance
    onAppearanceChange: (appearance: Appearance) => void
    onAdd: (doc: NewDocument) => void
    onOpenLink: (payload: string) => void
    onOpen: (doc: LibraryDocument) => void
    onRemove: (doc: LibraryDocument) => void
  } = $props()

  const appUrl = `${location.origin}${import.meta.env.BASE_URL}`
  const canReadClipboard = !!navigator.clipboard?.readText

  let text = $state('')
  let inputError = $state('')
  let showPaste = $state(!canReadClipboard)
  let showAppearance = $state(false)
  let inProgress = $derived(documents.filter((doc) => doc.position > 0 && !isFinished(doc)).length)

  function submit(event: SubmitEvent) {
    event.preventDefault()
    if (!text.trim()) return
    const payload = payloadFromLink(text, appUrl)
    if (payload) onOpenLink(payload)
    else onAdd({ title: '', text: readableText(text) })
    text = ''
  }

  async function readClipboard() {
    inputError = ''
    let clipboard: string
    try {
      clipboard = await navigator.clipboard.readText()
    } catch {
      inputError = "Couldn't read the clipboard. Paste into the box instead."
      return
    }
    const payload = payloadFromLink(clipboard, appUrl)
    if (payload) return onOpenLink(payload)
    const share = parseShare(new URLSearchParams({ text: clipboard }))
    if (share.kind === 'document') onAdd(share.document)
    else if (share.kind === 'link') inputError = "Links can't be opened yet. Copy the text itself instead."
    else inputError = 'The clipboard is empty.'
  }

  async function openFile(event: Event) {
    const input = event.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    inputError = ''
    try {
      const doc = textFromFile(file.name, await file.text())
      if (doc.text.trim()) onAdd(doc)
      else inputError = `${file.name} is empty.`
    } catch {
      inputError = `Couldn't read ${file.name}.`
    }
  }

  function percent(doc: LibraryDocument): number {
    return Math.floor((doc.position / Math.max(doc.tokenCount, 1)) * 100)
  }

  function status(doc: LibraryDocument): string {
    if (doc.position === 0) return 'Not started'
    const wordsLeft = doc.tokenCount - doc.position
    return `${percent(doc)}% · ${formatRemaining((wordsLeft / loadWpm()) * 60_000)}`
  }

  function finishedIn(doc: LibraryDocument): string {
    const words = `${formatCount(doc.tokenCount)} words`
    return doc.readingMs ? `${words} in ${formatDuration(doc.readingMs)}` : words
  }

  function remove(doc: LibraryDocument) {
    if (confirm(`Delete "${doc.title}"?`)) onRemove(doc)
  }
</script>

<div class="home">
  <header>
    <div class="brand">
      <svg class="logo" viewBox="0 0 512 512" aria-hidden="true">
        <rect width="512" height="512" rx="112" class="tile" />
        <rect x="248" y="92" width="16" height="60" rx="8" class="guide" />
        <rect x="248" y="360" width="16" height="60" rx="8" class="guide" />
        <path d="M166 262 L230 324 L350 196" class="tick" />
      </svg>
      <div class="name">
        <h1>di<span class="pivot">d</span>read</h1>
        <p class="tagline">Too long? Did read.</p>
      </div>
    </div>
    <button
      class="round"
      onclick={() => (showAppearance = !showAppearance)}
      aria-label="Display settings"
      aria-expanded={showAppearance}>Aa</button
    >
  </header>

  {#if showAppearance}
    <AppearanceSettings {appearance} onChange={onAppearanceChange} />
  {/if}

  {#if notice}<p class="notice" role="status">{notice}</p>{/if}

  <!-- Under a minute reads as a glitch rather than an achievement, so it waits until then. -->
  {#if summary.savedMs >= 60_000}
    <p class="saved">
      <strong>{formatDuration(summary.savedMs)}</strong>
      <span>saved this month, across {summary.count} {summary.count === 1 ? 'text' : 'texts'}</span>
    </p>
  {/if}

  <div class="inputs">
    {#if canReadClipboard}
      <button type="button" class="primary" onclick={readClipboard}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="8" y="2" width="8" height="4" rx="1" />
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        </svg>
        Read clipboard
      </button>
    {/if}
    <div class="secondary">
      {#if canReadClipboard}
        <button type="button" onclick={() => (showPaste = !showPaste)} aria-expanded={showPaste}>Paste text</button>
      {/if}
      <label class="file">
        Open file
        <input type="file" accept=".txt,.md,.markdown,text/plain,text/markdown" onchange={openFile} />
      </label>
    </div>

    {#if showPaste}
      <form onsubmit={submit}>
        <label for="text">Paste the text you want to read</label>
        <!-- svelte-ignore a11y_autofocus -->
        <textarea
          id="text"
          bind:value={text}
          rows="6"
          placeholder="Paste text here…"
          autofocus={canReadClipboard}
        ></textarea>
        <button type="submit" class:primary={!canReadClipboard} disabled={!text.trim()}>Read</button>
      </form>
    {/if}
    {#if inputError}<p class="error" role="alert">{inputError}</p>{/if}
  </div>

  {#if !storageAvailable}
    <p class="notice">Saving isn't available in this browser, so texts and positions won't be kept.</p>
  {/if}

  {#if documents.length > 0}
    <section>
      <div class="section-head">
        <h2>Library</h2>
        {#if inProgress > 0}<span>{inProgress} in progress</span>{/if}
      </div>
      <ul>
        {#each documents as doc (doc.id)}
          {@const done = isFinished(doc)}
          <li class:done>
            <button class="open" onclick={() => onOpen(doc)}>
              <span class="title">{doc.title}</span>
              {#if done}
                <span class="meta">
                  <span class="stamp">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                    Did read
                  </span>
                  <span>{finishedIn(doc)}</span>
                </span>
              {:else}
                <span class="bar" aria-hidden="true"><span style:width={`${percent(doc)}%`}></span></span>
                <span class="meta">
                  <span>{formatCount(doc.tokenCount)} words</span>
                  <span>{status(doc)}</span>
                </span>
              {/if}
            </button>
            <button class="delete" onclick={() => remove(doc)} aria-label={`Delete ${doc.title}`}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" /></svg>
            </button>
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  <footer class="version">
    {#if buildInfo.commit}
      <a href={`${REPOSITORY_URL}/commit/${buildInfo.commit}`} target="_blank" rel="noreferrer"
        >{formatVersion(buildInfo)}</a
      >
    {:else}
      {formatVersion(buildInfo)}
    {/if}
  </footer>
</div>

<style>
  .home {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    width: min(36rem, 100%);
    min-height: 100dvh;
    padding: 2.5rem 1.25rem calc(1.5rem + env(safe-area-inset-bottom));
    box-sizing: border-box;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .logo {
    width: 3.25rem;
    height: 3.25rem;
  }

  .logo .tile {
    fill: #1e1c19;
  }

  .logo .guide {
    fill: #8f897f;
  }

  .logo .tick {
    fill: none;
    stroke: #ff8a4c;
    stroke-width: 46;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  h1,
  h2 {
    margin: 0;
  }

  h1 {
    font-family: var(--display-font);
    font-size: 1.9rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1;
  }

  .pivot {
    color: var(--accent);
  }

  .name {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .tagline {
    margin: 0;
    font-size: 0.9rem;
    color: var(--muted);
  }

  .round {
    width: 2.75rem;
    height: 2.75rem;
    padding: 0;
    border-radius: 50%;
    background: transparent;
    font-weight: 600;
  }

  .saved {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin: 0;
  }

  .saved strong {
    font-family: var(--display-font);
    font-size: 2.75rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1;
  }

  .saved span {
    color: var(--muted);
  }

  .inputs,
  form {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .inputs button,
  .file {
    min-height: 3rem;
    border-radius: 0.9rem;
    font-weight: 600;
  }

  .primary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    min-height: 4rem;
    border: none;
    background: var(--accent);
    color: var(--on-accent);
    font-size: 1.1rem;
    font-weight: 700;
  }

  .primary svg {
    width: 1.4rem;
    height: 1.4rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  form .primary {
    min-height: 3.25rem;
  }

  .secondary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
    gap: 0.6rem;
  }

  .file {
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--guide);
    background: var(--surface);
    cursor: pointer;
  }

  .file:focus-within {
    outline: 2px solid var(--accent);
  }

  .file input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
  }

  form label {
    font-size: 0.9rem;
    color: var(--muted);
  }

  textarea {
    font: inherit;
    padding: 0.75rem;
    border-radius: 0.9rem;
    border: 1px solid var(--guide);
    background: var(--surface);
    color: inherit;
    resize: vertical;
  }

  .error {
    margin: 0;
    color: var(--accent);
  }

  .notice {
    margin: 0;
    color: var(--muted);
  }

  section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .section-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    font-size: 0.85rem;
    color: var(--muted);
  }

  h2 {
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  li {
    position: relative;
  }

  .open {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
    padding: 1rem 3.25rem 1rem 1rem;
    border: 1px solid transparent;
    border-radius: 1rem;
    background: var(--surface);
    text-align: left;
  }

  .done .open {
    border-color: var(--guide);
    background: transparent;
  }

  .title {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
    font-weight: 600;
    line-height: 1.35;
  }

  .done .title {
    font-weight: 500;
    color: var(--muted);
  }

  .bar {
    display: block;
    height: 0.375rem;
    border-radius: 0.2rem;
    background: var(--track);
    overflow: hidden;
  }

  .bar span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: var(--accent);
  }

  .meta {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    font-size: 0.85rem;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }

  .stamp {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    color: var(--accent);
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .stamp svg,
  .delete svg {
    width: 1rem;
    height: 1rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .delete {
    position: absolute;
    top: 0.4rem;
    right: 0.4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.75rem;
    height: 2.75rem;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: var(--muted);
  }

  .delete svg {
    stroke-width: 2.2;
  }

  .version {
    margin-top: auto;
    font-size: 0.8rem;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }

  .version a {
    color: inherit;
  }
</style>
