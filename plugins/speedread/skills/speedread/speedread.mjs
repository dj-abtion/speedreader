#!/usr/bin/env node
// Prints a Didread link that carries a Claude Code reply, so it can be read in one tap.
// With no input it reads the current session's transcript and picks the last finished reply.
//
//   node speedread.mjs            last reply before the current prompt
//   node speedread.mjs --back 2   the reply before that
//   node speedread.mjs --stdin    text piped in instead
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { deflateRawSync } from 'node:zlib'

export const DEFAULT_APP_URL = 'https://dj-abtion.github.io/speedreader/'
const WORDS_PER_MINUTE = 300

/**
 * @typedef {{ type: string, text?: string }} Block
 * @typedef {{
 *   type?: string,
 *   isMeta?: boolean,
 *   isSidechain?: boolean,
 *   isCompactSummary?: boolean,
 *   message?: { content?: string | Block[] },
 * }} Entry
 */

// Must stay compatible with decodeText in src/core/link.ts: deflate-raw, then base64url.
/** @param {string} text */
export function encodeText(text) {
  return deflateRawSync(Buffer.from(text, 'utf8'), { level: 9 }).toString('base64url')
}

/** @param {string} text */
export function readerLink(text, appUrl = DEFAULT_APP_URL) {
  return `${appUrl}#t=${encodeText(text)}`
}

// A turn starts at each prompt: a user message that is neither a tool result nor injected
// context such as an expanded skill. Its reply is the assistant text after the turn's last
// tool call, which leaves out narration like "Now running the tests" between tool calls.
// Turns that asked for a link are skipped, so "/speedread 2" right after "/speedread" still
// means the reply before the first link, not the link itself.
/**
 * @param {Entry[]} entries
 * @returns {string | null}
 */
export function lastReply(entries, back = 1) {
  /** @type {{ prompt: string, blocks: Block[] }[]} */
  const turns = []
  for (const entry of entries) {
    if (entry.isSidechain) continue
    const turn = turns.at(-1)
    if (isPrompt(entry)) turns.push({ prompt: promptText(entry), blocks: [] })
    else if (entry.type === 'assistant' && turn) turn.blocks.push(...blocks(entry.message?.content))
  }
  // The last turn is the one that asked for the link, so it never counts.
  const replies = turns
    .slice(0, -1)
    .filter((turn) => !SPEEDREAD_PROMPT.test(turn.prompt))
    .map((turn) => finalText(turn.blocks))
    .filter((reply) => reply && !LINK_REPLY.test(reply))
  return replies.at(-back) ?? null
}

// Typed as "/speedread 2", or expanded as <command-name>/speedread</command-name> once the
// skill is installed, optionally namespaced by its plugin.
const SPEEDREAD_PROMPT = /^\s*\/(speedread:)?speedread\b|<command-name>\/?(speedread:)?speedread<\/command-name>/
const LINK_REPLY = /\[⚡ Speed-read this reply\]\(/

/** @param {Entry} entry */
function promptText(entry) {
  return blocks(entry.message?.content)
    .map((block) => (block.type === 'text' ? (block.text ?? '') : ''))
    .join('\n')
}

/** @param {Entry} entry */
function isPrompt(entry) {
  if (entry.type !== 'user' || entry.isMeta || entry.isCompactSummary) return false
  const content = entry.message?.content
  if (typeof content === 'string') return true
  return blocks(content).some((block) => block.type === 'text')
}

/**
 * @param {string | Block[] | undefined} content
 * @returns {Block[]}
 */
function blocks(content) {
  if (Array.isArray(content)) return content
  return typeof content === 'string' ? [{ type: 'text', text: content }] : []
}

/** @param {Block[]} turnBlocks */
function finalText(turnBlocks) {
  const lastToolCall = turnBlocks.findLastIndex((block) => block.type === 'tool_use')
  return turnBlocks
    .slice(lastToolCall + 1)
    .map((block) => (block.type === 'text' ? (block.text ?? '').trim() : ''))
    .filter(Boolean)
    .join('\n\n')
}

/**
 * @param {string} path
 * @returns {Entry[]}
 */
export function readTranscript(path) {
  return readFileSync(path, 'utf8')
    .split('\n')
    .filter(Boolean)
    .flatMap((line) => {
      try {
        return [JSON.parse(line)]
      } catch {
        return []
      }
    })
}

/** @param {string | undefined} sessionId */
function findTranscript(sessionId) {
  const projects = join(process.env.CLAUDE_CONFIG_DIR ?? join(homedir(), '.claude'), 'projects')
  if (!existsSync(projects)) return null
  const files = readdirSync(projects).flatMap((dir) => {
    const folder = join(projects, dir)
    if (!statSync(folder).isDirectory()) return []
    return readdirSync(folder)
      .filter((name) => name.endsWith('.jsonl'))
      .map((name) => join(folder, name))
  })
  if (sessionId) return files.find((file) => file.endsWith(`${sessionId}.jsonl`)) ?? null
  return files.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0] ?? null
}

/**
 * @param {string} text
 * @param {string} link
 */
export function summary(text, link) {
  const words = text.split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE))
  return `[⚡ Speed-read this reply](${link}) · ${words.toLocaleString('en')} words, about ${minutes} min at ${WORDS_PER_MINUTE} wpm`
}

/** @param {string[]} argv */
function parseArgs(argv) {
  const args = { back: 1, stdin: false, transcript: /** @type {string | null} */ (null) }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--back') args.back = Number(argv[++i])
    else if (argv[i] === '--stdin') args.stdin = true
    else if (argv[i] === '--transcript') args.transcript = argv[++i]
    else throw new Error(`Unknown option: ${argv[i]}`)
  }
  if (!Number.isInteger(args.back) || args.back < 1) throw new Error('--back takes a whole number from 1')
  return args
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  let text
  if (args.stdin) {
    text = readFileSync(0, 'utf8').trim()
  } else {
    const transcript = args.transcript ?? findTranscript(process.env.CLAUDE_CODE_SESSION_ID)
    if (!transcript) throw new Error('Could not find the session transcript. Pipe the text in with --stdin.')
    text = lastReply(readTranscript(transcript), args.back)
  }
  if (!text) throw new Error('There is no earlier reply to link to.')
  console.log(summary(text, readerLink(text, process.env.SPEEDREADER_URL ?? DEFAULT_APP_URL)))
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    main()
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
}
