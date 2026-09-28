# Didread

An installable, offline-capable RSVP speed reader. See [SPEC.md](SPEC.md) for the full v1 design.

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

`plugins/speedread/` holds a Claude Code skill. It turns Claude's previous reply into a one-tap Didread link, with the text carried in the link's `#` fragment. Type `/speedread`, or `/speedread 2` for the reply before that. Claude answers with just the link.

The skill folder is self-contained: `SKILL.md` plus a dependency-free Node script. Install it one of two ways:

- **Every session, including the Claude app and cloud sessions:** zip the folder and upload it in the Skills section of your claude.ai settings. Skills on your account are synced into every Claude Code cloud session.

  ```sh
  cd plugins/speedread/skills && zip -r speedread.zip speedread
  ```

- **Claude Code CLI on your own machine:** this repo is also a plugin marketplace.

  ```sh
  claude plugin marketplace add dj-abtion/speedreader
  claude plugin install speedread@speedreader
  ```

The script can also be run directly: `node plugins/speedread/skills/speedread/speedread.mjs --stdin < reply.md`.

## Layout

- `src/core/` — framework-free reading logic: tokenizer, ORP pivot, timing, sentence navigation and the playback loop. Kept free of UI dependencies so it can be reused (e.g. by a future browser extension).
- `plugins/speedread/` — the `/speedread` Claude Code skill, also published as a plugin through `.claude-plugin/marketplace.json`.
