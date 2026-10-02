---
name: speedread
description: Turns one of Claude's replies, or part of one, into a one-tap Didread link for reading it quickly one word at a time (RSVP). Use when the user types /speedread or /speedread N (go N replies back), or asks to "speedread that", "speed-read this", "read that in Didread", "give me a Didread link", or "speedread just the plan section". Replies with one line - the link, word count and reading time. Do NOT use for summarising, shortening or rewriting a reply (the user wants the full text, just faster), or for web pages or files the user hasn't asked to speed-read.
argument-hint: "[replies back, default 1]"
allowed-tools: Bash(node:*)
---

# Speedread

Give the user a link that opens a reply in Didread (https://dj-abtion.github.io/speedreader/). The whole text travels inside the link's `#` fragment, which is never sent to a server.

## Steps

1. Run the bundled script. It lives in this skill's folder (the base directory shown when the skill loads):

   ```sh
   node "${CLAUDE_SKILL_DIR}/speedread.mjs" --back 1
   ```

   If `CLAUDE_SKILL_DIR` is empty, as in a chat in the Claude app, use the folder you read this SKILL.md from instead (usually `/mnt/skills/user/speedread`).

   Pass `--back N` to go N replies back. Use the number the user gave, e.g. `/speedread 2`, or 1 when they gave none. The script reads this session's transcript and takes the final text of that reply, leaving out narration between tool calls. Earlier link requests and their link replies don't count, so `/speedread 2` straight after `/speedread` means the reply before the first link.

   The script finds this session's transcript by `CLAUDE_CODE_SESSION_ID`, which Claude Code sets. Without it, the script falls back to the most recently changed transcript, which can belong to another open session. So if that variable is empty, use `--stdin` instead (below).

   On the user's own computer the script also opens the link in their browser and says so at the end of its line. It skips that in cloud sessions and over SSH. Pass `--no-open` if the user asks for just the link.

2. Reply with **exactly the one line the script prints** (a Markdown link, then the word count and reading time), for example:

   ```markdown
   [⚡ Speed-read this reply](https://dj-abtion.github.io/speedreader/#t=…) · 412 words, about 1 min at 300 wpm
   ```

   Don't add anything before or after it, repeat the reply, or summarise it. The user wants to save reading time. The one exception: if a standing instruction requires a closing line, such as an organization's sign-off, put that on its own line after the link, and nothing else.

## When the script can't read the transcript

This happens outside Claude Code (e.g. a chat in the Claude app), or when the script says it couldn't find the transcript. Use `--stdin` and pass it the reply's text exactly as you wrote it, Markdown included:

```sh
node "${CLAUDE_SKILL_DIR}/speedread.mjs" --stdin <<'SPEEDREAD_EOF'
…the reply's full text…
SPEEDREAD_EOF
```

Use `--stdin` the same way when the user wants something other than a whole reply sped up (e.g. "speedread just the plan section"). If Node isn't available, say so in one line. Don't try to build the link by hand, because the text has to be compressed exactly.
