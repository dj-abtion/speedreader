---
name: Didread
description: Too long? Did read. An RSVP speed reader where one fixed point carries the words.
colors:
  reading-lamp-amber: "#c2410c"
  reading-lamp-amber-dark: "#ff8a4c"
  on-amber: "#ffffff"
  on-amber-dark: "#1a1208"
  ink: "#1c1a17"
  ink-dark: "#efece6"
  muted: "#6b655c"
  muted-dark: "#a39d93"
  paper: "#f6f3ee"
  paper-dark: "#141311"
  surface: "#ffffff"
  surface-dark: "#1e1c19"
  guide: "#d9d2c7"
  guide-dark: "#3d3934"
  edge: "#8f887d"
  edge-dark: "#7a7369"
  track: "#ece6dc"
  track-dark: "#2e2b27"
typography:
  display:
    fontFamily: "Bricolage Grotesque Variable, Figtree Variable, system-ui, sans-serif"
    fontSize: "3.25rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Bricolage Grotesque Variable, Figtree Variable, system-ui, sans-serif"
    fontSize: "1.9rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.02em"
  stat:
    fontFamily: "Bricolage Grotesque Variable, Figtree Variable, system-ui, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  action:
    fontFamily: "Figtree Variable, system-ui, sans-serif"
    fontSize: "1.1rem"
    fontWeight: 700
  title:
    fontFamily: "Figtree Variable, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "Figtree Variable, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.45
  meta:
    fontFamily: "Figtree Variable, system-ui, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 400
    fontFeature: "tnum"
  label:
    fontFamily: "Figtree Variable, system-ui, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 700
    letterSpacing: "0.08em"
  label-small:
    fontFamily: "Figtree Variable, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    letterSpacing: "0.08em"
  reading-word:
    fontFamily: "system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 9vw, 4.5rem)"
    lineHeight: 1.2
  reading-phrase:
    fontFamily: "system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 6vw, 3.5rem)"
    lineHeight: 1.2
  code:
    fontFamily: "ui-monospace, SF Mono, Menlo, Consolas, monospace"
    fontSize: "0.9rem"
    lineHeight: 1.5
rounded:
  hairline: "0.2rem"
  sm: "0.5rem"
  md: "0.9rem"
  lg: "1rem"
  xl: "1.25rem"
  pill: "999px"
  circle: "50%"
spacing:
  xs: "0.25rem"
  sm: "0.6rem"
  md: "0.75rem"
  lg: "1rem"
  gutter: "1.25rem"
  xl: "1.5rem"
  xxl: "2rem"
components:
  button-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0.5rem 0.9rem"
  button-action:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: "3rem"
  button-primary:
    backgroundColor: "{colors.reading-lamp-amber}"
    textColor: "{colors.on-amber}"
    rounded: "{rounded.md}"
    height: "4rem"
  button-round:
    textColor: "{colors.ink}"
    rounded: "{rounded.circle}"
    size: "2.75rem"
  button-play:
    backgroundColor: "{colors.reading-lamp-amber}"
    textColor: "{colors.on-amber}"
    rounded: "{rounded.circle}"
    size: "4.5rem"
  pill:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0.5rem 0.9rem"
  library-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "1rem 3.25rem 1rem 1rem"
  library-card-done:
    textColor: "{colors.muted}"
    rounded: "{rounded.lg}"
    padding: "1rem 3.25rem 1rem 1rem"
  text-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0.75rem"
  segment-selected:
    backgroundColor: "{colors.reading-lamp-amber}"
    textColor: "{colors.surface}"
    padding: "0.4rem 0.75rem"
  banner:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    rounded: "{rounded.xl}"
    padding: "0.9rem 0.5rem 0.9rem 1.1rem"
---

# Design System: Didread

## Overview

**Creative North Star: "The Focal Point"**

Everything in Didread serves one fixed point: the spot slightly left of centre where each word lands, with its pivot letter lit in Reading-Lamp Amber and two thin guide ticks holding the column. The eye never moves, so the interface around that point has one job: get there quickly and then get out of the way. The library, the finish screen and the settings are calm frames around that point, not destinations in their own right.

The mood is calm. Neutrals are warm paper by day and warm dark by night, chrome is quiet and low-contrast, and controls fade away completely while words are playing. Amber appears only where attention belongs: the pivot letter, the one main action, progress, and the finish. The system is flat and soft-edged, built for thumbs on a phone first and keys on a desktop second.

The system avoids three things. It is not a productivity app, so no gradients, glows, glassmorphism or dashboard chrome. It is not a game, so no streaks, badges, confetti or leaderboards; finishing is a quiet win. And it is never cold, so no blue-greys, pure black or neutral grey palettes.

**Key Characteristics:**
- One fixed focal column (pivot at 40% across), held by guide ticks.
- A single accent, Reading-Lamp Amber, used sparingly and always with meaning.
- Warm-tinted neutrals in both themes; theme follows the system, with a light/dark override.
- Flat surfaces; depth comes from paper versus surface tone and hairline borders, never shadows.
- Soft, thumb-sized controls (2.75rem minimum), with exactly one filled amber action per screen.
- Controls fade while playing (300ms) and return on pause; only a faint progress line stays.

## Colors

A warm, near-monochrome paper palette with a single amber light source.

### Primary
- **Reading-Lamp Amber** (light `#c2410c`, dark `#ff8a4c`): the pivot letter of every flashed word, the "d" in the wordmark, the main action on each screen (Read clipboard, Play, Install, the finish screen's next step), progress fills, the "Did read" stamp, the self-drawing check, the time-saved figure, focus outlines and error text. In dark mode it shifts lighter and yellower to glow against the warm dark.
- **On Amber** (light `#ffffff`, dark `#1a1208`): text and icons on amber fills. Dark mode uses a warm near-black, not white.

### Neutral
- **Ink** (light `#1c1a17`, dark `#efece6`): body text and the reading word. Warm off-black and off-white, never pure.
- **Muted** (light `#6b655c`, dark `#a39d93`): secondary text such as taglines, metadata, section heads, the faint context sentence while paused, and the finish check's tile.
- **Paper** (light `#f6f3ee`, dark `#141311`): the page background, also used as the browser `theme-color`.
- **Surface** (light `#ffffff`, dark `#1e1c19`): one step up from paper, used for cards, default buttons, pills, text fields, the code panel and the banner.
- **Guide** (light `#d9d2c7`, dark `#3d3934`): decorative hairlines, the focal guide ticks and the unfilled part of the reader's progress line.
- **Edge** (light `#8f887d`, dark `#7a7369`): the boundary of a control the reader has to find by its outline alone, such as the paste field. It holds 3:1 against both Paper and Surface. Buttons with a text or icon label don't need it.
- **Track** (light `#ece6dc`, dark `#2e2b27`): the unfilled part of library progress bars.

### Named Rules
**The One Light Rule.** Amber is the only chromatic colour in the interface. If something is amber, it is either the focal point, the next action, or progress. Never use it as decoration.

**The Warm Neutral Rule.** Every neutral is tinted towards amber (hue about 75–85 in OKLCH). No `#000`, `#fff` text on a dark ground, or blue-grey anywhere. Pure white appears only as the light-theme surface and as text on amber.

## Typography

**Display Font:** Bricolage Grotesque Variable (falls back to Figtree, then system-ui)
**Body Font:** Figtree Variable (with system-ui, sans-serif)
**Reading Font:** system-ui by default, or a serif stack (ui-serif, Georgia, Times New Roman) chosen by the reader
**Mono Font:** ui-monospace, SF Mono, Menlo, Consolas

**Character:** Figtree is friendly and plain, so the interface reads easily without calling attention to itself. Bricolage Grotesque, heavy and slightly tightened, is reserved for the name and for numbers worth celebrating. The reading word deliberately uses the system font so it feels native and familiar at speed. Both brand fonts are bundled so they work offline.

### Hierarchy
- **Action** (Figtree 700, 1.1rem): the home screen's main button label.
- **Display** (Bricolage 800, 3.25rem, line-height 1, -0.02em): the "Did read" headline on the finish screen.
- **Stat** (Bricolage 700, 2.75rem, line-height 1, tabular): the home screen's time saved this month, and the finish screen's time saved (in amber).
- **Headline** (Bricolage 800, 1.9rem, line-height 1, -0.02em): the "didread" wordmark, with its middle "d" in amber.
- **Title** (Figtree 600, 1rem, line-height 1.35): library card titles, clamped to two lines, and button labels.
- **Body** (Figtree 400, 1rem, line-height 1.45): paragraphs and descriptions.
- **Meta** (Figtree 400, 0.85rem, tabular, Muted): progress, "N min left", word counts.
- **Label** (Figtree 700, 0.8rem, 0.08em, uppercase, Muted): section heads such as the library heading and the code panel header. **Label Small** (0.75rem) is used for "Up next" on the finish screen.
- **Reading Word** (system or serif, `clamp(2.25rem, 9vw, 4.5rem)` scaled by S/M/L/XL, line-height 1.2): one word per flash. **Reading Phrase** (`clamp(1.5rem, 6vw, 3.5rem)`) is used for two- and three-word chunks.

### Named Rules
**The Earned Display Rule.** Bricolage is used only for the brand name and for a number that celebrates the reader (time saved, finish stats). Headings for interface sections stay in small uppercase Figtree labels.

**The Tabular Numbers Rule.** Every number that changes or sits in a column (WPM, percentages, minutes left, version, stats) uses `font-variant-numeric: tabular-nums` so it never jitters.

## Layout

Single column, centred, phone-first. The home screen is at most 36rem wide, and the finish screen and reader controls at most 28rem. The code panel widens to 44rem and the paused context sentence to 40rem. Pages fill the viewport (`100dvh`), use a 1.25rem side gutter, and respect safe-area insets at the top and bottom.

Spacing is relaxed but not airy. Most stacks use 0.6–0.75rem gaps, sections use 1.5rem, and the finish screen uses 2rem. The footer sits at the bottom with `margin-top: auto`.

The reader is a full-viewport stage. The top bar holds close, the text's title (small, Muted, one line) and Aa. The word centres in the middle, and controls plus the progress line sit at the bottom. Tapping anywhere on the stage plays or pauses. While paused the screen is about reading first: the faint context sentence under the word, a hint (taps on touch screens, keys with a mouse), the amber play button as the only filled control, and quiet sentence skips beside it. Below 360px the settings row wraps.

**The Fixed Column Rule.** The word frame is a three-column grid (`2fr | pivot | 3fr`) with the pivot column 40% across. Guide ticks sit exactly on that column. Never centre the word or move the pivot; a word that would overflow is scaled down with `--fit` instead.

## Elevation & Depth

The system is flat. There are no box-shadows anywhere. Depth comes from tone alone: in both themes Surface sits one step lighter than Paper, and a 1px Guide hairline separates elements where tone isn't enough. A finished library card drops its surface fill and keeps only the hairline, so it reads as quieter, not raised.

### Named Rules
**The Amber Ring Rule.** Keyboard focus is a 2px amber outline, 2px out (`:focus-visible`). On an amber-filled action the ring turns Ink so it stays visible. The reader's stage never shows a ring; Space and the play button cover it. Text selection, the caret and scrollbars are themed from the palette too.

**The Paper-and-Card Rule.** There are exactly two planes: Paper and Surface. If an element needs to stand out further, it gets amber (it's the action), not a shadow.

## Shapes

Soft, generous corners that scale with the element. Default buttons and segmented controls are 0.5rem. Action buttons, text fields and the code panel are 0.9rem. Library cards and the "Up next" card are 1rem, and the install banner is 1.25rem. Icon buttons, the play button and the progress thumb are full circles, and the words-per-flash control is a full pill. Progress bars are thin (0.375rem) with a 0.2rem radius.

Icons are line-drawn: currentColor strokes at 2.2 (3 for the small stamp check), round caps and joins, no fills except the play triangle.

The mark is a rounded tile (radius about 22% of its size) with two short guide ticks and an amber check. It echoes the reader's focal column and the "Did read" finish.

## Components

### Buttons
Soft and thumb-sized; quiet by default, with only one main action filled amber.
- **Shape:** gently rounded (0.5rem) by default, 0.9rem on full-width actions.
- **Default:** Surface fill, Guide hairline, inherited text, padding 0.5rem 0.9rem.
- **Action:** full-width, at least 3rem tall, weight 600, 0.9rem radius (Paste text, Open file, Continue reading).
- **Primary:** Reading-Lamp Amber fill with On Amber text, no border, weight 700, about 1.1rem text. 4rem tall on the home screen with a 1.4rem line icon, and 3.25–3.5rem in forms and on the finish screen. Only one per screen.
- **Round icon:** a 2.75rem transparent circle with a Guide hairline, for Aa and close. The reader's sentence skips (3.25rem) drop the hairline and use Muted icons, like delete and dismiss. It grows to 3.25rem with a Surface fill when it needs more presence.
- **Disabled:** 40% opacity.

### Play Button (signature)
A 4.5rem amber circle with a 1.75rem play or pause icon in On Amber. It sits between the « and » sentence buttons, 1.75rem apart. It is the single strongest element on the paused reader.

### Speed and Words per Flash
The speed is a plain readout, not a control: tabular "300" in weight 600 with a Muted "wpm", between transparent − / + line-icon steps. A step that hits the limit greys out and says why in its tooltip. Words per flash is the one pill: Surface fill, Guide hairline, full pill shape, at least 6.5rem by 2.75rem. On touch screens a vertical swipe on the stage changes speed without pausing (up is faster, one step per 40px). A brief Surface pill bubble confirms keyboard and swipe changes while playing, just under the word on the focal column.

### Library Card
- **Corner Style:** 1rem.
- **Background:** Surface, with no visible border (it is transparent).
- **Content:** a two-line clamped title (600), a 0.375rem progress bar (amber fill on Track) and a tabular meta line ("N% · M min left"). The padding leaves room on the right for a round delete button pinned top-right.
- **Finished state:** a transparent background with a Guide hairline, a muted title at weight 500, and an amber uppercase **Did read** stamp with a small check.

### Inputs / Fields
- **Text area:** Surface fill, Guide hairline, 0.9rem radius, 0.75rem padding, resizable vertically. The label above is 0.9rem Muted.
- **File picker:** styled as an Action button, with the native input hidden. Focus shows a 2px amber outline.

### Segmented Control
Used for theme, font and size in the "Aa" panel. Joined Surface segments with Guide hairlines and 0.5rem outer corners. The selected segment fills with amber and its text takes the Surface colour. The radio inputs stay for keyboard and screen readers, and focus shows a 2px amber outline offset by 2px.

### Install Banner
A Surface card with a Guide hairline and 1.25rem radius. Muted copy with the key phrase in Ink, a compact amber Install button (2.75rem tall) and a round × dismiss.

### Reader Progress Line
A 4px line with a 2.75rem invisible hit area for dragging, which lifts it clear of the phone's home-indicator edge. It is amber up to the current position and Guide after it, with a 14px amber circle as the thumb. While playing it stays as a faint line (40% opacity, no thumb, not interactive), so progress is never fully out of sight.

### Code Stop (signature)
When playback reaches a code block it stops and says so: an uppercase Label header, "Paused for code" on the left and the language name with the line count on the right ("TypeScript · 3 lines"). The code sits in a Surface panel (0.9rem radius, monospace 0.9rem) that is only as tall as its code, up to 60% of the screen, and wraps on phones rather than scrolling sideways. **Continue reading** is the one amber action and takes focus, with a quiet Muted **Back a sentence** under it. The transport and the speed controls hide until reading resumes.

### Settings Sheet
In the reader, Aa opens a sheet over the playback controls rather than above the word: Surface fill, Guide hairline, 1rem radius, pinned 1rem above the bottom edge. The controls and progress line fade out under it. The word never moves or hides, so theme, font and size changes preview on the word itself. Playing closes the sheet, and Esc closes it from anywhere (focus returns to Aa) before Esc leaves the reader. On the home screen the same segmented controls sit in the page flow.

### First-visit Welcome
An empty library shows the reader's focal frame in miniature: "reading" with its amber pivot and guide ticks, a one-line Title heading, one Muted sentence on how it works and what to do, and a **Try a sample** pill that opens a short built-in text.

### Finish Check (signature)
A 9rem mark: two Muted guide ticks, as in the reader, with an amber check between them that draws itself in (600ms, 150ms delay, `cubic-bezier(0.3, 0, 0.2, 1)`). It doesn't animate when reduced motion is requested.

### Finish Figure
Under the title, one figure carries the moment: the time saved as an amber Stat, with "saved" in Muted beneath it. A Meta-sized sentence shows the working ("110 words in 7 s. At 238 wpm, the adult average, they would take 28 s."). A read slower than average leads with its own reading time instead, so the screen never claims a saving that didn't happen. No stat tiles.

## Do's and Don'ts

### Do:
- **Do** keep the pivot column at 40% across, with guide ticks, for every word and chunk.
- **Do** use Reading-Lamp Amber for one main action per screen, plus the pivot, progress and finish moments.
- **Do** keep tap targets at least 2.75rem, and give the main action 3.25–4rem of height.
- **Do** give focus the amber ring (Ink on amber fills), and theme selection, caret and scrollbars.
- **Do** use Edge, not Guide, for a field that's found only by its outline.
- **Do** separate planes with tone (Paper and Surface) and 1px Guide hairlines.
- **Do** fade chrome while playing (`opacity` 300ms, `pointer-events: none`, and `inert` so Tab can't reach it) and bring it back on pause. Only the faint progress line stays.
- **Do** use tabular numbers for every changing figure.
- **Do** respect `prefers-reduced-motion`: drop the bubble and check-drawing animations.
- **Do** define every new colour for both themes on `:root`, and redefine it in both dark-mode blocks.

### Don't:
- **Don't** add gradients, glows, glassmorphism, shadows or dashboard-style chrome.
- **Don't** add streaks, badges, confetti, points or leaderboards. Finishing stays a quiet stamp and a drawn check.
- **Don't** use cold greys, blue-greys, pure black backgrounds or white text on dark. Neutrals stay warm.
- **Don't** introduce a second accent colour.
- **Don't** use Bricolage for interface headings; keep it for the name and celebratory numbers.
- **Don't** centre the reading word or animate it; words flash in place.
