<script lang="ts">
  import { onMount } from 'svelte'
  import { CLI_COMMANDS, SKILL_README_URL, SKILL_ZIP_URL } from './skill'

  let { onBack }: { onBack: () => void } = $props()

  const canCopy = !!navigator.clipboard?.writeText

  let back: HTMLButtonElement | undefined = $state()
  let copied = $state<string | null>(null)
  let copiedTimer: ReturnType<typeof setTimeout> | undefined

  async function copy(command: string) {
    try {
      await navigator.clipboard.writeText(command)
    } catch {
      return
    }
    copied = command
    clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => (copied = null), 2000)
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') onBack()
  }

  onMount(() => {
    back?.focus()
    return () => clearTimeout(copiedTimer)
  })
</script>

<svelte:window onkeydown={onKeydown} />

<div class="guide">
  <header>
    <button class="round" bind:this={back} onclick={onBack} aria-label="Back to library">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
    </button>
  </header>

  <div class="intro">
    <h1>Use with Claude</h1>
    <p>
      Add the <code>/speedread</code> skill to Claude. After a long answer, type <code>/speedread</code> and Claude
      replies with a link that opens that answer here.
    </p>
    <p class="muted">The text travels inside the link and never goes to a server.</p>
  </div>

  <section>
    <h2>Claude app, web and cloud sessions</h2>
    <a class="primary" href={SKILL_ZIP_URL} rel="noreferrer">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>
      Download skill
    </a>
    <ol>
      <li>In Claude, open Customize → Skills → + → Create skill → Upload a skill.</li>
      <li>Choose the <code>speedread.zip</code> you downloaded.</li>
      <li>Make sure code execution is turned on.</li>
    </ol>
    <p class="muted">Uploaded skills don't update themselves. Download and upload again to get a newer version.</p>
  </section>

  <section>
    <h2>Claude Code in a terminal</h2>
    <p>Run these one at a time. The skill then shows as <code>didread:speedread</code> and keeps itself up to date.</p>
    <ul>
      {#each CLI_COMMANDS as command (command)}
        <li class="command">
          <code>{command}</code>
          {#if canCopy}
            <button onclick={() => copy(command)} aria-label={`Copy ${command}`}>
              {copied === command ? 'Copied' : 'Copy'}
            </button>
          {/if}
        </li>
      {/each}
    </ul>
  </section>

  <footer>
    <a href={SKILL_README_URL} target="_blank" rel="noreferrer">More details on GitHub</a>
  </footer>
</div>

<style>
  .guide {
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
    width: min(36rem, 100%);
    min-height: 100dvh;
    padding: 1rem 1.25rem calc(1.5rem + env(safe-area-inset-bottom));
    box-sizing: border-box;
  }

  header {
    margin-left: -0.5rem;
  }

  .round {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.75rem;
    height: 2.75rem;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: transparent;
  }

  svg {
    width: 1.25rem;
    height: 1.25rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .intro,
  section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  h1,
  h2,
  p {
    margin: 0;
  }

  h1 {
    font-family: var(--display-font);
    font-size: 2.25rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1;
  }

  h2 {
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }

  p,
  li {
    line-height: 1.5;
  }

  .muted {
    font-size: 0.9rem;
    color: var(--muted);
  }

  code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.9em;
  }

  .primary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    min-height: 3.5rem;
    border-radius: 0.9rem;
    background: var(--accent);
    color: var(--on-accent);
    font-weight: 700;
    text-decoration: none;
  }

  ol {
    margin: 0;
    padding-left: 1.25rem;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .command {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.5rem 0.5rem 0.9rem;
    border-radius: 0.9rem;
    background: var(--surface);
  }

  .command code {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .command button {
    flex-shrink: 0;
    min-width: 4.75rem;
    min-height: 2.5rem;
    border-radius: 0.7rem;
    font-weight: 600;
  }

  footer {
    margin-top: auto;
    font-size: 0.9rem;
  }

  footer a {
    color: var(--muted);
  }
</style>
