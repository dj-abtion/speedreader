<script lang="ts">
  import { installOffer } from './install.svelte'
</script>

{#if installOffer.kind}
  <aside class="install" aria-label="Install Didread">
    <p>
      <strong>Put Didread on your home screen.</strong>
      {#if installOffer.kind === 'prompt'}
        Works offline, one tap away{installOffer.canShareTo ? ', and you can share text straight to it' : ''}.
      {:else}
        Tap
        <svg class="share" viewBox="0 0 24 24" role="img" aria-label="Share">
          <path d="M12 3v12M8 7l4-4 4 4M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
        </svg>
        then <strong>Add to Home Screen</strong>.
      {/if}
    </p>
    {#if installOffer.kind === 'prompt'}
      <button class="primary" onclick={() => installOffer.install()}>Install</button>
    {/if}
    <button class="dismiss" onclick={() => installOffer.dismiss()} aria-label="Don't show again">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" /></svg>
    </button>
  </aside>
{/if}

<style>
  .install {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.9rem 0.5rem 0.9rem 1.1rem;
    border: 1px solid var(--guide);
    border-radius: 1.25rem;
    background: var(--surface);
  }

  p {
    flex: 1;
    margin: 0;
    line-height: 1.4;
    color: var(--muted);
  }

  strong {
    color: var(--text);
  }

  .share {
    width: 1.1em;
    height: 1.1em;
    vertical-align: -0.15em;
    fill: none;
    stroke: var(--accent);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .primary {
    flex-shrink: 0;
    min-height: 2.75rem;
    padding: 0 1.25rem;
    border: none;
    border-radius: 0.9rem;
    background: var(--accent);
    color: var(--on-accent);
    font-weight: 700;
  }

  .dismiss {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 2.75rem;
    height: 2.75rem;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: var(--muted);
  }

  .dismiss svg {
    width: 1rem;
    height: 1rem;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.2;
    stroke-linecap: round;
  }
</style>
