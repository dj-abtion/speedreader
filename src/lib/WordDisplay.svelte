<script lang="ts">
  import { splitAtPivot } from '../core/orp'

  let { word }: { word: string } = $props()

  let parts = $derived(splitAtPivot(word))
  let phrase = $derived(word.includes(' '))

  let frame: HTMLDivElement
  let before: HTMLSpanElement
  let after: HTMLSpanElement

  // Shrinks the text just enough that neither side spills past its column, so wide chunks and
  // large font sizes never push the pivot off its fixed position.
  $effect(() => {
    if (!word) return
    frame.style.setProperty('--fit', '1')
    const scale = Math.min(1, fitRatio(before), fitRatio(after))
    frame.style.setProperty('--fit', String(scale < 1 ? scale * FIT_MARGIN : 1))
  })

  const FIT_MARGIN = 0.97

  function fitRatio(element: HTMLElement): number {
    return element.scrollWidth > element.clientWidth ? element.clientWidth / element.scrollWidth : 1
  }
</script>

<div class="frame" class:phrase aria-live="off" bind:this={frame}>
  <span class="before" bind:this={before}>{parts.before}</span><span class="pivot"
    >{parts.pivot}</span
  ><span class="after" bind:this={after}>{parts.after}</span>
</div>

<style>
  /* The pivot sits in a fixed column slightly left of centre so the eye never has to move. */
  .frame {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 2fr) auto minmax(0, 3fr);
    align-items: baseline;
    width: 100%;
    padding: 0.5em 0;
    font-size: calc(var(--word-size) * var(--fit, 1));
    line-height: 1.2;
    white-space: pre;
  }

  /* Chunks run up to three words, so they need a smaller size to stay inside the frame. */
  .frame.phrase {
    font-size: calc(var(--phrase-size) * var(--fit, 1));
  }

  .frame::before,
  .frame::after {
    content: '';
    position: absolute;
    left: 40%;
    width: 2px;
    height: 0.35em;
    background: var(--guide);
  }

  .frame::before {
    top: 0;
  }

  .frame::after {
    bottom: 0;
  }

  .before {
    text-align: right;
  }

  .pivot {
    color: var(--accent);
  }

  .after {
    text-align: left;
  }
</style>
