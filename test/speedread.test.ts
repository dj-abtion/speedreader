import { describe, expect, it } from 'vitest'
import { decodeText, payloadFromLink } from '../src/core/link.ts'
import {
  DEFAULT_APP_URL,
  encodeText,
  lastReply,
  readerLink,
  summary,
} from '../plugins/speedread/skills/speedread/speedread.mjs'

const prompt = (text: string) => ({ type: 'user', message: { role: 'user', content: text } })
const say = (text: string) => ({ type: 'assistant', message: { content: [{ type: 'text', text }] } })
const toolCall = () => ({ type: 'assistant', message: { content: [{ type: 'tool_use', id: 't' }] } })
const toolResult = () => ({
  type: 'user',
  message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't', content: 'ok' }] },
})

describe('speedread link script', () => {
  it('makes links the app decodes back to the same text', async () => {
    const text = '## Plan\n\nRead faster — “one word” at a time. Ærø, 東京, 🚀.'
    expect(await decodeText(encodeText(text))).toBe(text)

    const payload = payloadFromLink(readerLink(text), DEFAULT_APP_URL)
    expect(payload).not.toBeNull()
    expect(await decodeText(payload!)).toBe(text)
  })

  it('picks the finished reply before the prompt that asked for the link', () => {
    const entries = [
      prompt('Explain the plan'),
      say('Let me look at the code first.'),
      toolCall(),
      toolResult(),
      say('Here is the plan.'),
      say('It has two parts.'),
      prompt('/speedread'),
      { type: 'user', isMeta: true, message: { content: [{ type: 'text', text: 'skill body' }] } },
      toolCall(),
    ]
    expect(lastReply(entries)).toBe('Here is the plan.\n\nIt has two parts.')
  })

  it('counts back through earlier replies and skips turns with no text', () => {
    const entries = [
      prompt('first'),
      say('Reply one.'),
      prompt('second'),
      toolCall(),
      toolResult(),
      prompt('third'),
      say('Reply three.'),
      prompt('/speedread'),
    ]
    expect(lastReply(entries, 1)).toBe('Reply three.')
    expect(lastReply(entries, 2)).toBe('Reply one.')
    expect(lastReply(entries, 3)).toBeNull()
  })

  it('counts back from before earlier link requests', () => {
    const linkReply = '[⚡ Speed-read this reply](https://example.com/#t=abc) · 3 words'
    const entries = [
      prompt('first'),
      say('Reply one.'),
      prompt('second'),
      say('Reply two.'),
      prompt('/speedread'),
      toolCall(),
      toolResult(),
      say(linkReply),
      prompt('<command-message>speedread</command-message>\n<command-name>/speedread</command-name>'),
      say(linkReply),
      prompt('speedread that please'),
      say(`Here you go:\n\n${linkReply}`),
      prompt('/speedread 2'),
    ]
    expect(lastReply(entries, 1)).toBe('Reply two.')
    expect(lastReply(entries, 2)).toBe('Reply one.')
  })

  it('skips link requests made under a plugin or account prefix', () => {
    const linkReply = '[⚡ Speed-read this reply](https://example.com/#t=abc) · 3 words'
    const entries = [
      prompt('question'),
      say('The answer.'),
      prompt('/didread:speedread'),
      say(linkReply),
      prompt('<command-name>/anthropic-skills:speedread</command-name>'),
      say(linkReply),
      prompt('/speedread:speedread'),
    ]
    expect(lastReply(entries)).toBe('The answer.')
  })

  it('still counts replies to prompts that only mention the skill', () => {
    const entries = [prompt('now do the /speedread skill'), say('Done, the skill is built.'), prompt('/speedread')]
    expect(lastReply(entries)).toBe('Done, the skill is built.')
  })

  it('ignores subagent messages and compaction summaries', () => {
    const entries = [
      prompt('question'),
      say('Main reply.'),
      { ...say('Subagent chatter.'), isSidechain: true },
      { ...prompt('summary of earlier conversation'), isCompactSummary: true },
      prompt('/speedread'),
    ]
    expect(lastReply(entries)).toBe('Main reply.')
  })

  it('has nothing to link before the first reply', () => {
    expect(lastReply([prompt('/speedread')])).toBeNull()
    expect(lastReply([])).toBeNull()
  })

  it('summarises the link with the word count and reading time', () => {
    const text = Array.from({ length: 900 }, () => 'word').join(' ')
    expect(summary(text, 'LINK')).toBe(
      '[⚡ Speed-read this reply](LINK) · 900 words, about 3 min at 300 wpm',
    )
  })
})
