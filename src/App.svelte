<script lang="ts">
  import { onMount } from 'svelte'
  import { readableText, titleFromText, type NewDocument } from './core/document'
  import { decodeText, payloadFromHash } from './core/link'
  import { parseShare } from './core/share'
  import { tokenize, type Token } from './core/tokenize'
  import { monthSummary } from './core/stats'
  import { applyAppearance, loadAppearance, saveAppearance, type Appearance } from './lib/appearance'
  import Finish from './lib/Finish.svelte'
  import Home from './lib/Home.svelte'
  import { isFinished, openLibrary, type LibraryDocument } from './lib/library'
  import { loadFinishes, recordFinish } from './lib/readingLog'
  import { SHARED_FLAG, takeSharedFields } from './lib/shareInbox'
  import Reader from './lib/Reader.svelte'
  import { GUIDE_HASH } from './lib/skill'
  import SkillGuide from './lib/SkillGuide.svelte'

  interface Reading {
    id: string | null
    title: string
    tokens: Token[]
    position: number
    // Reading time already spent on this read-through before the reader opened.
    readingMs: number
  }

  interface Finished {
    id: string | null
    title: string
    tokens: Token[]
    readingMs: number
    next: LibraryDocument | null
  }

  const library = openLibrary()

  let documents = $state<LibraryDocument[]>([])
  let storageAvailable = $state(true)
  let reading = $state<Reading | null>(null)
  let finished = $state<Finished | null>(null)
  let finishes = $state(loadFinishes())
  let summary = $derived(monthSummary(finishes))
  let notice = $state('')
  let appearance = $state(loadAppearance())
  let showGuide = $state(location.hash === GUIDE_HASH)

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
    let id: string | null = null
    try {
      id = (await library.add(newDoc)).id
    } catch {
      storageAvailable = false
    }
    finished = null
    reading = { id, title: newDoc.title, tokens: tokenize(newDoc.text), position: 0, readingMs: 0 }
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

  // A finished text opens at the start for another read-through.
  function open(doc: LibraryDocument) {
    const again = isFinished(doc)
    finished = null
    reading = {
      id: doc.id,
      title: doc.title,
      tokens: tokenize(doc.text),
      position: again ? 0 : doc.position,
      readingMs: again ? 0 : (doc.readingMs ?? 0),
    }
    library.markOpened(doc.id).catch(() => {})
  }

  async function remove(doc: LibraryDocument) {
    await library.remove(doc.id).catch(() => {})
    await refresh()
  }

  function saveProgress(index: number, readingMs: number) {
    if (reading?.id) library.saveProgress(reading.id, index, reading.readingMs + readingMs).catch(() => {})
  }

  async function finish(readingMs: number) {
    if (!reading) return
    const { id, title, tokens } = reading
    const total = reading.readingMs + readingMs
    recordFinish({ at: Date.now(), words: tokens.length, readingMs: total })
    finishes = loadFinishes()
    navigator.vibrate?.(40)
    reading = null
    finished = { id, title, tokens, readingMs: total, next: null }
    if (id) await library.markFinished(id, total).catch(() => {})
    await refresh()
    if (finished?.id === id) {
      finished.next = documents.find((doc) => doc.id !== id && !isFinished(doc)) ?? null
    }
  }

  function readAgain() {
    if (!finished) return
    const { id, title, tokens } = finished
    finished = null
    reading = { id, title, tokens, position: 0, readingMs: 0 }
  }

  async function backToLibrary() {
    finished = null
    await refresh()
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

  function onHashChange() {
    showGuide = location.hash === GUIDE_HASH
    receiveLink()
  }

  function openGuide() {
    history.pushState({ guide: true }, '', GUIDE_HASH)
    showGuide = true
  }

  // Going back undoes the entry openGuide pushed, so the browser's own back button agrees. A
  // guide opened straight from a shared link has no entry of ours to go back to.
  function closeGuide() {
    if (history.state?.guide) return history.back()
    history.replaceState(null, '', location.pathname + location.search)
    showGuide = false
  }

  onMount(() => {
    window.addEventListener('hashchange', onHashChange)
    receiveLink().then(receiveShare).then(refresh)
    return () => window.removeEventListener('hashchange', onHashChange)
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
        onFinish={finish}
        onExit={exit}
      />
    {/key}
  {:else if finished}
    <Finish
      title={finished.title}
      words={finished.tokens.length}
      readingMs={finished.readingMs}
      next={finished.next}
      onReadNext={open}
      onReadAgain={readAgain}
      onLibrary={backToLibrary}
    />
  {:else if showGuide}
    <SkillGuide onBack={closeGuide} />
  {:else}
    <Home
      {documents}
      {storageAvailable}
      {summary}
      {notice}
      {appearance}
      onAppearanceChange={changeAppearance}
      onAdd={add}
      onOpenLink={openLink}
      onOpen={open}
      onRemove={remove}
      onShowGuide={openGuide}
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
