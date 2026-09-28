---
name: speedread
description: Turns Claude's previous reply into a one-tap Speedreader link, for reading long answers quickly one word at a time (RSVP). Use when the user types /speedread, or asks to speed-read, "speedread that", or read a reply in Speedreader. Takes an optional number of replies to go back (default 1).
argument-hint: "[replies back, default 1]"
allowed-tools: Bash(node:*)
---

# Speedread

Give the user a link that opens a reply in Speedreader (https://dj-abtion.github.io/speedreader/). The whole text travels inside the link's `#` fragment, which is never sent to a server.

## Steps

1. Run the bundled script. It lives in this skill's folder (the base directory shown when the skill loads):

   ```sh
   node "${CLAUDE_SKILL_DIR}/speedread.mjs" --back 1
   ```

   Pass `--back N` to go N replies back. Use the number the user gave, e.g. `/speedread 2`, or 1 when they gave none. The script reads this session's transcript and takes the final text of that reply, leaving out narration between tool calls.

2. Reply with **exactly the one line the script prints** (a Markdown link, then the word count and reading time). Don't add anything before or after it, repeat the reply, or summarise it. The user wants to save reading time.

## When the script can't read the transcript

This happens outside Claude Code, or when the script says it couldn't find the transcript. Use `--stdin` and pass it the reply's text exactly as you wrote it, Markdown included:

```sh
node "${CLAUDE_SKILL_DIR}/speedread.mjs" --stdin <<'SPEEDREAD_EOF'
…the reply's full text…
SPEEDREAD_EOF
```

Use `--stdin` the same way when the user wants something other than a whole reply sped up (e.g. "speedread just the plan section"). If Node isn't available, say so in one line. Don't try to build the link by hand, because the text has to be compressed exactly.
