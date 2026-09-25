import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { openLibrary, type Library } from './library'

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

  it('saves the reading position', async () => {
    const doc = await library.add({ title: 'Tale', text: 'a b c d' })
    await library.savePosition(doc.id, 3)
    expect((await library.get(doc.id))?.position).toBe(3)
  })

  it('ignores position updates for deleted documents', async () => {
    const doc = await library.add({ title: 'Tale', text: 'a b c' })
    await library.remove(doc.id)
    await library.savePosition(doc.id, 2)
    expect(await library.get(doc.id)).toBeUndefined()
    expect(await library.list()).toEqual([])
  })
})
