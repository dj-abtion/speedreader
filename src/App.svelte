<script lang="ts">
  import { tokenize, type Token } from './core/tokenize'
  import PasteView from './lib/PasteView.svelte'
  import Reader from './lib/Reader.svelte'

  let tokens = $state<Token[] | null>(null)
</script>

<main>
  {#if tokens}
    <Reader {tokens} onExit={() => (tokens = null)} />
  {:else}
    <PasteView onStart={(text) => (tokens = tokenize(text))} />
  {/if}
</main>

<style>
  main {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100dvh;
  }
</style>
