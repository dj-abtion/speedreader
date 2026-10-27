<script lang="ts">
  import { FONTS, SIZES, THEMES, type Appearance } from './appearance'

  let {
    appearance,
    onChange,
  }: {
    appearance: Appearance
    onChange: (appearance: Appearance) => void
  } = $props()

  const THEME_LABELS = { system: 'System', light: 'Light', dark: 'Dark' }
  const FONT_LABELS = { sans: 'Sans', serif: 'Serif' }
</script>

<div class="appearance">
  <fieldset>
    <legend>Theme</legend>
    {#each THEMES as theme (theme)}
      <label>
        <input
          type="radio"
          name="theme"
          checked={appearance.theme === theme}
          onchange={() => onChange({ ...appearance, theme })}
        />{THEME_LABELS[theme]}
      </label>
    {/each}
  </fieldset>

  <fieldset>
    <legend>Font</legend>
    {#each FONTS as font (font)}
      <label class={font}>
        <input
          type="radio"
          name="font"
          checked={appearance.font === font}
          onchange={() => onChange({ ...appearance, font })}
        />{FONT_LABELS[font]}
      </label>
    {/each}
  </fieldset>

  <fieldset>
    <legend>Size</legend>
    {#each SIZES as size (size)}
      <label>
        <input
          type="radio"
          name="size"
          checked={appearance.size === size}
          onchange={() => onChange({ ...appearance, size })}
        />{size}
      </label>
    {/each}
  </fieldset>
</div>

<style>
  .appearance {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem 1.25rem;
  }

  fieldset {
    display: flex;
    flex-wrap: wrap;
    margin: 0;
    padding: 0;
    border: none;
  }

  legend {
    padding: 0;
    margin-bottom: 0.35rem;
    font-size: 0.8rem;
    color: var(--muted);
  }

  /* Each group is a segmented control: the radios stay for keyboard and screen readers. */
  label {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 2.75rem;
    min-height: 2.75rem;
    padding: 0 0.75rem;
    box-sizing: border-box;
    border: 1px solid var(--guide);
    background: var(--surface);
    cursor: pointer;
  }

  label + label {
    border-left: none;
  }

  label:first-of-type {
    border-radius: 0.5rem 0 0 0.5rem;
  }

  label:last-of-type {
    border-radius: 0 0.5rem 0.5rem 0;
  }

  /* The choice is shown in ink, not amber, so amber stays for the focal point and the main action. */
  label:has(input:checked) {
    background: var(--text);
    border-color: var(--text);
    color: var(--background);
    font-weight: 600;
  }

  /* The ring lifts above its neighbours, and turns ink on the amber selected segment. */
  label:has(input:focus-visible) {
    position: relative;
    z-index: 1;
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  label:has(input:checked:focus-visible) {
    outline-color: var(--accent);
  }

  label.serif {
    font-family: var(--serif-font);
  }

  input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
  }
</style>
