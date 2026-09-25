<script lang="ts">
  import { textFromFile, type NewDocument } from '../core/document'
  import type { LibraryDocument } from './library'

  let {
    documents,
    storageAvailable,
    notice = '',
    onAdd,
    onOpen,
    onRemove,
  }: {
    documents: LibraryDocument[]
    storageAvailable: boolean
    notice?: string
    onAdd: (doc: NewDocument) => void
    onOpen: (doc: LibraryDocument) => void
    onRemove: (doc: LibraryDocument) => void
  } = $props()

  let text = $state('')
  let fileError = $state('')

  function submit(event: SubmitEvent) {
    event.preventDefault()
    if (!text.trim()) return
    onAdd({ title: '', text })
    text = ''
  }

  async function openFile(event: Event) {
    const input = event.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    fileError = ''
    try {
      const doc = textFromFile(file.name, await file.text())
      if (doc.text.trim()) onAdd(doc)
      else fileError = `${file.name} is empty.`
    } catch {
      fileError = `Couldn't read ${file.name}.`
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
      <button type="submit" disabled={!text.trim()}>Read</button>
    </div>
    {#if fileError}<p class="error" role="alert">{fileError}</p>{/if}
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

  .progress {
    flex-shrink: 0;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }
</style>
