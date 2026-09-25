<script lang="ts">
  import { onMount } from 'svelte'
  import { titleFromText, type NewDocument } from './core/document'
  import { parseShare } from './core/share'
  import { tokenize, type Token } from './core/tokenize'
  import Home from './lib/Home.svelte'
  import { openLibrary, type LibraryDocument } from './lib/library'
  import Reader from './lib/Reader.svelte'

  interface Reading {
    id: string | null
    tokens: Token[]
    position: number
  }

  const library = openLibrary()

  let documents = $state<LibraryDocument[]>([])
  let storageAvailable = $state(true)
  let reading = $state<Reading | null>(null)
  let notice = $state('')

  async function refresh() {
    try {
      documents = await library.list()
    } catch {
      storageAvailable = false
    }
  }

  async function add(doc: NewDocument) {
    const newDoc = { ...doc, title: doc.title || titleFromText(doc.text) }
    try {
      const saved = await library.add(newDoc)
      reading = { id: saved.id, tokens: tokenize(saved.text), position: 0 }
    } catch {
      storageAvailable = false
      reading = { id: null, tokens: tokenize(newDoc.text), position: 0 }
    }
  }

  function open(doc: LibraryDocument) {
    reading = { id: doc.id, tokens: tokenize(doc.text), position: doc.position }
    library.markOpened(doc.id).catch(() => {})
  }

  async function remove(doc: LibraryDocument) {
    await library.remove(doc.id).catch(() => {})
    await refresh()
  }

  function saveProgress(index: number) {
    if (reading?.id) library.savePosition(reading.id, index).catch(() => {})
  }

  async function exit() {
    reading = null
    await refresh()
  }

  async function receiveShare() {
    const share = parseShare(new URLSearchParams(location.search))
    if (location.search) history.replaceState(null, '', location.pathname)
    if (share.kind === 'document') await add(share.document)
    if (share.kind === 'link') notice = "Links can't be opened yet. Share the text itself instead."
  }

  onMount(async () => {
    await receiveShare()
    await refresh()
  })
</script>

<main>
  {#if reading}
    {#key reading.id}
      <Reader
        tokens={reading.tokens}
        startIndex={reading.position}
        onProgress={saveProgress}
        onExit={exit}
      />
    {/key}
  {:else}
    <Home {documents} {storageAvailable} {notice} onAdd={add} onOpen={open} onRemove={remove} />
  {/if}
</main>

<style>
  main {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100dvh;
  }
</style>
