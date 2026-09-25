<script lang="ts">
  import { splitAtPivot } from '../core/orp'

  let { word }: { word: string } = $props()

  let parts = $derived(splitAtPivot(word))
</script>

<div class="frame" aria-live="off">
  <span class="before">{parts.before}</span><span class="pivot">{parts.pivot}</span><span
    class="after">{parts.after}</span
  >
</div>

<style>
  /* The pivot sits in a fixed column slightly left of centre so the eye never has to move. */
  .frame {
    position: relative;
    display: grid;
    grid-template-columns: 2fr auto 3fr;
    align-items: baseline;
    width: 100%;
    padding: 0.5em 0;
    font-size: var(--word-size);
    line-height: 1.2;
    white-space: pre;
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
