# Didread

Too long? Did read. An installable, offline-capable RSVP speed reader. See [SPEC.md](SPEC.md) for the full v1 design.

The repo, the web address and the on-device storage keys still say `speedreader`, so existing installs, saved libraries and links keep working under the new name.

## Development

```sh
npm install
npm run dev     # start the dev server
npm test        # unit tests (Vitest)
npm run lint    # lint (ESLint)
npm run check   # typecheck
npm run build   # production build to dist/
npm run test:e2e  # end-to-end tests (Playwright)
```

If Chromium is already installed, point Playwright at it instead of running `npx playwright install`:

```sh
CHROMIUM_EXECUTABLE=/path/to/chrome npm run test:e2e
```

## Deployment

Merging to `main` deploys to GitHub Pages at `https://dj-abtion.github.io/speedreader/` via `.github/workflows/deploy.yml`. The repository's Pages source must be set to **GitHub Actions**.

## `/speedread` skill for Claude Code

`plugins/speedread/` holds a Claude Code skill. It turns Claude's previous reply into a one-tap Didread link, with the text carried in the link's `#` fragment. Type `/speedread`, or `/speedread 2` for the reply before that. Claude answers with just the link, and on your own computer the script also opens it in your browser.

The skill folder is self-contained: `SKILL.md` plus a dependency-free Node script. To share it, send people [the in-app guide](https://dj-abtion.github.io/speedreader/#claude), which is also linked from the home screen's footer as "Use with Claude". Install it one of two ways:

- **Every session, including the Claude app and cloud sessions:** download [speedread.zip](https://github.com/dj-abtion/speedreader/releases/download/speedread-skill/speedread.zip), then in Claude open Customize → Skills → + → Create skill → Upload a skill and choose it. Code execution must be turned on. Skills on your account are synced into every Claude Code cloud session. `.github/workflows/skill-release.yml` rebuilds the zip whenever the skill changes on `main`, so the link always gives the current version. Uploaded skills don't update themselves: upload the new zip to pick up a change. In a chat the skill is called `speedread`, so type `/speedread` or just ask Claude to speed-read its reply.

- **Claude Code CLI on your own machine:** this repo is also a plugin marketplace. Run the two commands one at a time; the skill then shows as `didread:speedread` in the `/` menu and updates itself. Plugins only load in Claude Code (the terminal, or the Code tab in Claude Desktop), not in the Claude app's chats; for those, upload the zip as above.

  ```sh
  claude plugin marketplace add dj-abtion/speedreader
  claude plugin install didread@speedreader
  ```

The plugin was called `speedread` before; if you installed it under that name, run `claude plugin uninstall speedread@speedreader` first.

### Brewale (Abtion colleagues)

The skill is also published to Abtion's Brewale as `speedread`, so colleagues' agents pick it up with nothing to install. Brewale serves the instructions, and the agent downloads the script from `https://dj-abtion.github.io/speedreader/speedread.mjs`, which every deploy publishes from `plugins/speedread/skills/speedread/speedread.mjs`. Script changes therefore reach colleagues once they're merged and deployed, with no Brewale update. The Brewale skill also bundles a copy of the script as a fallback for sessions that can't reach the site.

The Brewale instructions live in [`brewale/speedread.md`](brewale/speedread.md). When you change them, publish a new version of the `speedread` skill in Brewale with that file as the body. Refreshing the bundled fallback copy at the same time is good practice.

The script can also be run directly: `node plugins/speedread/skills/speedread/speedread.mjs --stdin < reply.md`.

## Layout

- `src/core/` — framework-free reading logic: tokenizer, ORP pivot, timing, sentence navigation and the playback loop. Kept free of UI dependencies so it can be reused (e.g. by a future browser extension).
- `plugins/speedread/` — the `/speedread` Claude Code skill, also published as a plugin through `.claude-plugin/marketplace.json`.
