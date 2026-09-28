<script lang="ts">
  import { onMount } from 'svelte'
  import { readableText, titleFromText, type NewDocument } from './core/document'
  import { decodeText, payloadFromHash } from './core/link'
  import { parseShare } from './core/share'
  import { tokenize, type Token } from './core/tokenize'
  import { applyAppearance, loadAppearance, saveAppearance, type Appearance } from './lib/appearance'
  import Home from './lib/Home.svelte'
  import { openLibrary, type LibraryDocument } from './lib/library'
  import { SHARED_FLAG, takeSharedFields } from './lib/shareInbox'
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
  let appearance = $state(loadAppearance())

  function changeAppearance(next: Appearance) {
    appearance = next
    saveAppearance(next)
    applyAppearance(next)
  }

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

  // Tapping the same link again, as happens with a link that stays in a chat, resumes the text
  // saved the first time rather than adding a copy.
  async function openLink(payload: string) {
    let text: string
    try {
      text = readableText(await decodeText(payload))
    } catch {
      notice = "This link couldn't be opened. It may have been cut off when it was copied."
      return
    }
    const saved = (await library.list().catch(() => [])).find((doc) => doc.text === text)
    if (saved) open(saved)
    else await add({ title: '', text })
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

  // Shares normally arrive via the service worker's inbox with only a flag in the URL. Reading
  // the query string too keeps shares working from installs still on the old GET share target.
  async function receiveShare() {
    const query = new URLSearchParams(location.search)
    const fields = query.has(SHARED_FLAG) ? await takeSharedFields() : null
    const share = parseShare(fields ? new URLSearchParams({ ...fields }) : query)
    if (location.search) history.replaceState(null, '', location.pathname)
    if (share.kind === 'document') await add(share.document)
    if (share.kind === 'link') notice = "Links can't be opened yet. Share the text itself instead."
  }

  // The fragment is cleared straight away so the text doesn't linger in the address bar or in
  // the history entry.
  async function receiveLink() {
    const payload = payloadFromHash(location.hash)
    if (payload === null) return
    history.replaceState(null, '', location.pathname + location.search)
    await openLink(payload)
  }

  onMount(() => {
    window.addEventListener('hashchange', receiveLink)
    receiveLink().then(receiveShare).then(refresh)
    return () => window.removeEventListener('hashchange', receiveLink)
  })
</script>

<main>
  {#if reading}
    {#key reading.id}
      <Reader
        tokens={reading.tokens}
        startIndex={reading.position}
        {appearance}
        onAppearanceChange={changeAppearance}
        onProgress={saveProgress}
        onExit={exit}
      />
    {/key}
  {:else}
    <Home
      {documents}
      {storageAvailable}
      {notice}
      {appearance}
      onAppearanceChange={changeAppearance}
      onAdd={add}
      onOpenLink={openLink}
      onOpen={open}
      onRemove={remove}
    />
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
