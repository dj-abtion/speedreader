<script lang="ts">
  import { tick } from 'svelte'
  import { readableText, textFromFile, type NewDocument } from '../core/document'
  import { formatCount, formatDuration, formatRemaining } from '../core/format'
  import { payloadFromLink } from '../core/link'
  import { parseShare } from '../core/share'
  import type { Appearance } from './appearance'
  import AppearanceSettings from './AppearanceSettings.svelte'
  import InstallBanner from './InstallBanner.svelte'
  import { isFinished, type LibraryDocument } from './library'
  import { SAMPLE } from './sample'
  import { loadWpm } from './settings'
  import { GUIDE_HASH } from './skill'
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
    onShowGuide,
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
    onShowGuide: () => void
  } = $props()

  const appUrl = `${location.origin}${import.meta.env.BASE_URL}`
  const canReadClipboard = !!navigator.clipboard?.readText

  let text = $state('')
  let inputError = $state('')
  let showPaste = $state(!canReadClipboard)
  let showAppearance = $state(false)
  let inProgress = $derived(documents.filter((doc) => doc.position > 0 && !isFinished(doc)).length)
  // Unfinished texts lead, so the one to continue is never below a text that's already done.
  let ordered = $derived([...documents].sort((a, b) => Number(isFinished(a)) - Number(isFinished(b))))
  let textarea = $state<HTMLTextAreaElement>()

  async function togglePaste() {
    showPaste = !showPaste
    if (!showPaste) return
    await tick()
    textarea?.focus()
  }

  function submit(event: SubmitEvent) {
    event.preventDefault()
    if (!text.trim()) return
    inputError = ''
    const payload = payloadFromLink(text, appUrl)
    if (payload) onOpenLink(payload)
    // A bare web link isn't text to read, and the clipboard route already says so.
    else if (parseShare(new URLSearchParams({ text })).kind === 'link') {
      inputError = "Links can't be opened yet. Paste the text itself instead."
      return
    } else onAdd({ title: '', text: readableText(text) })
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
      <!-- On an empty library the sample is the amber first step, since nothing may be copied yet. -->
      <button type="button" class="primary" class:quiet={documents.length === 0} onclick={readClipboard}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="8" y="2" width="8" height="4" rx="1" />
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        </svg>
        Read clipboard
      </button>
    {/if}
    <div class="secondary">
      {#if canReadClipboard}
        <button type="button" onclick={togglePaste} aria-expanded={showPaste}>Paste text</button>
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
          bind:this={textarea}
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

  <!-- Offered once there's something in the library, so it never greets a first visit. -->
  {#if documents.length > 0}
    <InstallBanner />
    <section>
      <div class="section-head">
        <h2>Library</h2>
        {#if inProgress > 0}<span>{inProgress} in progress</span>{/if}
      </div>
      <ul>
        {#each ordered as doc (doc.id)}
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
  {:else}
    <!-- A first visit gets a glimpse of the reader and a text to try it on. -->
    <section class="welcome" aria-labelledby="welcome-head">
      <div class="demo" aria-hidden="true">
        <span class="before">re</span><span class="pivot">a</span><span class="after">ding</span>
      </div>
      <h2 id="welcome-head">One word at a time, right where your eyes are</h2>
      <p>
        Words flash at a fixed point with one letter lit, so your eyes never have to move.
        {canReadClipboard ? 'Copy something long, then tap Read clipboard.' : 'Paste something long to start.'}
      </p>
      <button type="button" class="sample" onclick={() => onAdd(SAMPLE)}>Try a sample</button>
    </section>
  {/if}

  <footer>
    <a
      class="claude"
      href={GUIDE_HASH}
      onclick={(event) => {
        event.preventDefault()
        onShowGuide()
      }}>Use with Claude →</a>
    <span class="version">
      {#if buildInfo.commit}
        <a href={`${REPOSITORY_URL}/commit/${buildInfo.commit}`} target="_blank" rel="noreferrer"
          >{formatVersion(buildInfo)}</a
        >
      {:else}
        {formatVersion(buildInfo)}
      {/if}
    </span>
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

  /* At large text sizes the Aa button wraps under the name instead of running off screen. */
  header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  /* Capped by the viewport too, so enlarged text still leaves the name room on a phone. */
  .logo {
    flex-shrink: 0;
    width: min(3.25rem, 13vw);
    height: min(3.25rem, 13vw);
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

  /* Before anything is in the library, Read clipboard steps back and the sample leads. */
  .primary.quiet {
    min-height: 3.25rem;
    border: 1px solid var(--guide);
    background: var(--surface);
    color: var(--text);
    font-size: 1rem;
    font-weight: 600;
  }

  .primary svg {
    flex-shrink: 0;
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

  .file:has(input:focus-visible) {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
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
    border: 1px solid var(--edge);
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

  .welcome {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    padding: 1.5rem 0 0;
    text-align: center;
  }

  /* The reader's own focal frame, in miniature: pivot column at 40%, with its guide ticks. */
  .demo {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 2fr) auto minmax(0, 3fr);
    align-items: baseline;
    width: min(18rem, 100%);
    padding: 0.45em 0;
    font-family: var(--reading-font);
    font-size: var(--word-size);
    line-height: 1.2;
  }

  .demo::before,
  .demo::after {
    content: '';
    position: absolute;
    left: 40%;
    width: 2px;
    height: 0.3em;
    background: var(--guide);
  }

  .demo::before {
    top: 0;
  }

  .demo::after {
    bottom: 0;
  }

  .demo .before {
    text-align: right;
  }

  .demo .after {
    text-align: left;
  }

  .welcome h2 {
    max-width: 20rem;
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: normal;
    text-transform: none;
    text-wrap: balance;
  }

  .welcome p {
    max-width: 22rem;
    margin: 0;
    color: var(--muted);
    line-height: 1.45;
    text-wrap: pretty;
  }

  .sample {
    min-height: 3.25rem;
    margin-top: 0.5rem;
    padding: 0 1.75rem;
    border: none;
    border-radius: 999px;
    background: var(--accent);
    color: var(--on-accent);
    font-weight: 700;
  }

  footer {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem 1rem;
    margin-top: auto;
    font-size: 0.8rem;
    color: var(--muted);
  }

  /* Inline links get a taller tap area without changing the footer's height. */
  footer a {
    display: inline-block;
    margin: -0.7rem 0;
    padding: 0.7rem 0;
  }

  /* Amber is kept for the main action, so the footer link is ink with an underline. */
  .claude {
    color: var(--text);
    font-weight: 600;
    text-decoration: underline;
    text-decoration-color: var(--guide);
    text-underline-offset: 0.2em;
  }

  .version {
    font-variant-numeric: tabular-nums;
  }

  .version a {
    color: inherit;
    text-decoration: none;
  }

  .version a:hover {
    text-decoration: underline;
  }
</style>
