# Speedread

Give the user a link that opens a reply in Didread (https://dj-abtion.github.io/speedreader/), an RSVP speed reader. The whole text travels inside the link's `#` fragment, which is never sent to a server. The link must be built by the script `speedread.mjs`, because the text has to be compressed exactly the way the reader decodes it. It needs only Node, no packages.

## Steps

1. **Get the script.** Use the first of these that works, and call its path `SCRIPT`:

   - `${CLAUDE_SKILL_DIR}/speedread.mjs`, if this skill was installed on disk (Claude Code plugin or uploaded skill).
   - The current version, published with every deploy of the app:

     ```sh
     SCRIPT="${TMPDIR:-/tmp}/speedread.mjs"
     curl -fsSL https://dj-abtion.github.io/speedreader/speedread.mjs -o "$SCRIPT"
     ```

   - If the download fails (no network, or the host is blocked), the copy bundled with this skill: fetch it with `get_skill_file("speedread", "speedread.mjs")` and write its content, unchanged, to `"${TMPDIR:-/tmp}/speedread.mjs"`. It may be a little older, but it still works.

2. **Run it.**

   ```sh
   node "$SCRIPT" --back 1
   ```

   Pass `--back N` to go N replies back. Use the number the user gave, e.g. `/speedread 2`, or 1 when they gave none. The script reads this session's Claude Code transcript and takes the final text of that reply, leaving out narration between tool calls. Earlier link requests and their link replies don't count, so `/speedread 2` straight after `/speedread` means the reply before the first link.

   The script finds this session's transcript by `CLAUDE_CODE_SESSION_ID`, which Claude Code sets. Without it, the script falls back to the most recently changed transcript, which can belong to another open session. So if that variable is empty, use `--stdin` instead (below).

   On the user's own computer the script also opens the link in their browser and says so at the end of its line. It skips that in cloud sessions and over SSH. Pass `--no-open` if the user asks for just the link.

3. **Reply with exactly the one line the script prints** (a Markdown link, then the word count and reading time), for example:

   ```markdown
   [⚡ Speed-read this reply](https://dj-abtion.github.io/speedreader/#t=…) · 412 words, about 1 min at 300 wpm
   ```

   Don't add anything before or after it, repeat the reply, or summarise it. The user wants to save reading time. The one exception: if a standing instruction requires a closing line, such as an organization's sign-off, put that on its own line after the link, and nothing else.

## When the script can't read the transcript

This happens outside Claude Code (e.g. the Claude app), or when the script says it couldn't find the transcript. Use `--stdin` and pass it the reply's text exactly as you wrote it, Markdown included:

```sh
node "$SCRIPT" --stdin <<'SPEEDREAD_EOF'
…the reply's full text…
SPEEDREAD_EOF
```

Use `--stdin` the same way when the user wants something other than a whole reply sped up (e.g. "speedread just the plan section").

## Gotchas

- If Node isn't available, or code execution is off, say so in one line. Don't try to build the link by hand.
- Don't edit the script's content when saving it; the compression format must stay byte-compatible with the reader.
- If an Abtion colleague asks how to install it: they don't need to. Brewale already gives them this skill, and adding the copy from the organization's skill library in Claude or uploading the zip only leaves them with two `speedread` skills. In Claude Code, the Brewale entry in the `/` menu (`/claude.ai brewale-abtion-mcp:speedread`) fails with "Unknown command" because Claude Code cuts the name at the space; tell them to ask in words ("speedread that") or install the `didread` plugin for a working `/didread:speedread`.
- Source, installation guide and the Claude Code plugin: https://dj-abtion.github.io/speedreader/#claude and https://github.com/dj-abtion/speedreader.
