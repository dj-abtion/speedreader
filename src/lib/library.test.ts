import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { isFinished, openLibrary, type Library } from './library'

let library: Library
let dbCounter = 0

beforeEach(() => {
  library = openLibrary(`test-${++dbCounter}`)
})

describe('library', () => {
  it('adds a document with its title, token count and a starting position of 0', async () => {
    const doc = await library.add({ title: 'Tale', text: 'It was the best of times.' })
    expect(doc).toMatchObject({ title: 'Tale', text: 'It was the best of times.', position: 0, tokenCount: 6 })
    expect(await library.get(doc.id)).toEqual(doc)
  })

  it('lists documents most recently opened first', async () => {
    const first = await library.add({ title: 'First', text: 'one' })
    const second = await library.add({ title: 'Second', text: 'two' })
    expect((await library.list()).map((d) => d.title)).toEqual(['Second', 'First'])

    await library.markOpened(first.id)
    expect((await library.list()).map((d) => d.id)).toEqual([first.id, second.id])
  })

  it('saves the reading position and reading time', async () => {
    const doc = await library.add({ title: 'Tale', text: 'a b c d' })
    await library.saveProgress(doc.id, 2, 1500)
    expect(await library.get(doc.id)).toMatchObject({ position: 2, readingMs: 1500 })
  })

  it('marks a document finished at its last word', async () => {
    const doc = await library.add({ title: 'Tale', text: 'a b c d' })
    expect(isFinished(doc)).toBe(false)
    await library.markFinished(doc.id, 2000)
    const finished = await library.get(doc.id)
    expect(finished).toMatchObject({ position: 3, readingMs: 2000, finishedAt: expect.any(Number) })
    expect(isFinished(finished!)).toBe(true)
  })

  it('ignores position updates for deleted documents', async () => {
    const doc = await library.add({ title: 'Tale', text: 'a b c' })
    await library.remove(doc.id)
    await library.saveProgress(doc.id, 2, 0)
    expect(await library.get(doc.id)).toBeUndefined()
    expect(await library.list()).toEqual([])
  })
})
