<script lang="ts">
  import { readableText, textFromFile, type NewDocument } from '../core/document'
  import { payloadFromLink } from '../core/link'
  import { parseShare } from '../core/share'
  import type { Appearance } from './appearance'
  import AppearanceSettings from './AppearanceSettings.svelte'
  import type { LibraryDocument } from './library'
  import { buildInfo, formatVersion, REPOSITORY_URL } from './version'

  let {
    documents,
    storageAvailable,
    notice = '',
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

  function progress(doc: LibraryDocument): string {
    if (doc.tokenCount > 0 && doc.position >= doc.tokenCount - 1) return 'Finished'
    return `${Math.floor((doc.position / Math.max(doc.tokenCount, 1)) * 100)}%`
  }

  function remove(doc: LibraryDocument) {
    if (confirm(`Delete "${doc.title}"?`)) onRemove(doc)
  }
</script>

<div class="home">
  <h1>Speedreader</h1>

  {#if notice}<p class="notice" role="status">{notice}</p>{/if}

  <form onsubmit={submit}>
    <label for="text">Paste the text you want to read</label>
    <textarea id="text" bind:value={text} rows="8" placeholder="Paste text here…"></textarea>
    <div class="actions">
      <label class="file">
        Open file
        <input type="file" accept=".txt,.md,.markdown,text/plain,text/markdown" onchange={openFile} />
      </label>
      {#if canReadClipboard}
        <button type="button" class="clipboard" onclick={readClipboard}>Read clipboard</button>
      {/if}
      <button type="submit" disabled={!text.trim()}>Read</button>
    </div>
    {#if inputError}<p class="error" role="alert">{inputError}</p>{/if}
  </form>

  {#if !storageAvailable}
    <p class="notice">Saving isn't available in this browser, so texts and positions won't be kept.</p>
  {/if}

  {#if documents.length > 0}
    <section>
      <h2>Library</h2>
      <ul>
        {#each documents as doc (doc.id)}
          <li>
            <button class="open" onclick={() => onOpen(doc)}>
              <span class="title">{doc.title}</span>
              <span class="progress">{progress(doc)}</span>
            </button>
            <button class="delete" onclick={() => remove(doc)} aria-label={`Delete ${doc.title}`}>✕</button>
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  <details class="display">
    <summary>Display</summary>
    <AppearanceSettings {appearance} onChange={onAppearanceChange} />
  </details>

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
    gap: 1.25rem;
    width: min(40rem, 100%);
    padding: 1.5rem 1rem;
    box-sizing: border-box;
  }

  h1,
  h2 {
    margin: 0;
  }

  h2 {
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  textarea {
    font: inherit;
    padding: 0.75rem;
    border-radius: 0.5rem;
    border: 1px solid var(--guide);
    background: var(--surface);
    color: inherit;
    resize: vertical;
  }

  .actions {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .clipboard {
    margin-left: auto;
  }

  .file {
    padding: 0.5rem 0.9rem;
    border-radius: 0.5rem;
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

  .error {
    margin: 0;
    color: var(--accent);
  }

  .notice {
    margin: 0;
    color: var(--muted);
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  li {
    display: flex;
    gap: 0.5rem;
  }

  .open {
    flex: 1;
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    min-width: 0;
    text-align: left;
  }

  .title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .display summary {
    margin-bottom: 0.75rem;
    cursor: pointer;
  }

  .version {
    font-size: 0.8rem;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }

  .version a {
    color: inherit;
  }

  .progress {
    flex-shrink: 0;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }
</style>
