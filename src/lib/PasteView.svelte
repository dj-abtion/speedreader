<script lang="ts">
  let { onStart }: { onStart: (text: string) => void } = $props()

  let text = $state('')

  function start(event: SubmitEvent) {
    event.preventDefault()
    if (text.trim()) onStart(text)
  }
</script>

<form class="paste" onsubmit={start}>
  <h1>Speedreader</h1>
  <label for="text">Paste the text you want to read</label>
  <textarea id="text" bind:value={text} rows="12" placeholder="Paste text here…"></textarea>
  <button type="submit" disabled={!text.trim()}>Read</button>
</form>

<style>
  .paste {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: min(40rem, 100%);
    padding: 1rem;
    box-sizing: border-box;
  }

  h1 {
    margin: 0 0 0.5rem;
  }

  textarea {
    font: inherit;
    padding: 0.75rem;
    border-radius: 0.5rem;
    border: 1px solid var(--guide);
    background: var(--surface);
    color: inherit;
    resize: vertical;
  }

  button {
    align-self: flex-end;
  }
</style>
