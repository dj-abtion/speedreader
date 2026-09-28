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
    padding: 0.4rem 0.75rem;
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

  label:has(input:checked) {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--surface);
  }

  label:has(input:focus-visible) {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
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
