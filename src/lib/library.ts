import { openDB, type DBSchema } from 'idb'
import type { NewDocument } from '../core/document'
import { tokenize } from '../core/tokenize'

export interface LibraryDocument extends NewDocument {
  id: string
  position: number
  tokenCount: number
  lastOpenedAt: number
  // Active reading time for the current read-through. Documents saved before it was tracked
  // have none.
  readingMs?: number
  finishedAt?: number
}

export function isFinished(doc: LibraryDocument): boolean {
  return doc.tokenCount > 0 && doc.position >= doc.tokenCount - 1
}

interface LibrarySchema extends DBSchema {
  documents: {
    key: string
    value: LibraryDocument
    indexes: { lastOpenedAt: number }
  }
}

export type Library = ReturnType<typeof openLibrary>

export function openLibrary(name = 'speedreader') {
  const db = openDB<LibrarySchema>(name, 1, {
    upgrade(database) {
      const store = database.createObjectStore('documents', { keyPath: 'id' })
      store.createIndex('lastOpenedAt', 'lastOpenedAt')
    },
  })

  // Timestamps must be strictly increasing so "most recently opened" stays well-defined
  // even when two writes land in the same millisecond.
  let lastTimestamp = 0
  const now = () => (lastTimestamp = Math.max(Date.now(), lastTimestamp + 1))

  return {
    async add({ title, text }: NewDocument): Promise<LibraryDocument> {
      const doc: LibraryDocument = {
        id: crypto.randomUUID(),
        title,
        text,
        position: 0,
        tokenCount: tokenize(text).length,
        lastOpenedAt: now(),
        readingMs: 0,
      }
      await (await db).add('documents', doc)
      return doc
    },

    async get(id: string): Promise<LibraryDocument | undefined> {
      return (await db).get('documents', id)
    },

    async list(): Promise<LibraryDocument[]> {
      return (await (await db).getAllFromIndex('documents', 'lastOpenedAt')).reverse()
    },

    async markOpened(id: string): Promise<void> {
      await update(id, (doc) => ({ ...doc, lastOpenedAt: now() }))
    },

    async saveProgress(id: string, position: number, readingMs: number): Promise<void> {
      await update(id, (doc) => ({ ...doc, position, readingMs }))
    },

    async markFinished(id: string, readingMs: number): Promise<void> {
      await update(id, (doc) => ({
        ...doc,
        position: Math.max(doc.tokenCount - 1, 0),
        readingMs,
        finishedAt: Date.now(),
      }))
    },

    async remove(id: string): Promise<void> {
      await (await db).delete('documents', id)
    },
  }

  async function update(id: string, change: (doc: LibraryDocument) => LibraryDocument) {
    const tx = (await db).transaction('documents', 'readwrite')
    const doc = await tx.store.get(id)
    if (doc) await tx.store.put(change(doc))
    await tx.done
  }
}
