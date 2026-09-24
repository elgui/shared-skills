# Identity

Each course gets its own look, derived from its subject. The structure (lesson contract, chrome,
walkthroughs) is shared; the look is not. The SP-404 course's look was derived from the gear, and
that is what made it feel like the machine's own manual rather than a template.

Everything visual lives in `site/assets/identity.css`. The runtime reads tokens; the identity
defines them, styles the two rooms, and styles the subject's own vocabulary (key caps, chips,
tiles). The template's placeholder carries the marker `cs:default-identity`; `check` warns until
it is replaced.

## 1. Derive, do not decorate

1. **List the subject's materials.** The instrument's case and panel, its screen, its indicator
   lights, the printed manual, the surfaces where the practice happens (the bench, the mixer, the
   field, the stage).
2. **Page, ink and panel come from those materials.** SP-404: the page is the tin grey of the
   case, the panel is the black of its body. Patterns demo: pale workshop grey, a green-black ink,
   the cutting mat's green for panels.
3. **The signal is the subject's own indicator.** One accent for the whole course: lit tiles, the
   encore ring, the active walkthrough step, the rail's lit number. SP-404: the pad LEDs' amber.
   Patterns: the cutting mat's ruling yellow.
4. **The two rooms get two materials that match how their exercises end.** SP-404: the Lab is
   graph paper with blue ink (preparing, the Deluge's grid), the Stage is the SP's black body with
   amber (playing in the dark). Patterns: Draft is tracing vellum, Try is the cutting mat. The two
   must be told apart at a glance, including at 380 px.
5. **One type family with range** does more than two faces. SP-404: Archivo, with the width axis
   carrying the hierarchy (expanded headings, condensed labels). The patterns demo uses the same
   face condensed for display, which is why it does not look like the SP-404 course: a face is not
   an identity.
6. **The red flag stays red** (`--hazard`) in every identity, with a lighter variant inside a dark
   room. It must never be confused with the signal.

Avoid the defaults that appear whatever the subject (the frontend-design skill lists them): warm
cream with a serif and a terracotta accent, near-black with one acid accent, identical rounded
cards with soft shadows, all-caps eyebrow labels over every heading. Where the subject genuinely
has one of these looks, use it on purpose.

## 2. Type

- **Self-hosted, OFL or similar**, woff2 in `site/assets/fonts/` with its licence file, declared by
  `@font-face` in `identity.css`, credited on the sources page.
- To get a face offline: download the family from Google Fonts (the download includes the licence)
  or from the `@fontsource-variable/<name>` npm package, and copy the `.woff2` and licence into
  `fonts/`. A variable font with a width or optical axis gives the most range for one file.
- Set a clear scale; body 16 to 17 px; measure under 70 characters (`--measure`).
- Check at 380 px: the landing hero, the board tiles and the rail are where a face breaks first.

## 3. Tokens

Required (the runtime reads these; fallbacks exist but `check` expects an identity):

| Token | Role |
|---|---|
| `--font` | the family stack |
| `--page`, `--ink`, `--ink-soft`, `--rule` | page surface, text, secondary text (AA on `--page`), hairlines |
| `--panel`, `--panel-ink` | dark surfaces: pager, tooltip, widgets |
| `--signal`, `--signal-ink`, `--signal-on-panel` | the one accent, text on it, the accent on a dark panel |
| `--link`, `--focus` | source marks and dotted words; the focus ring |
| `--hazard`, `--hazard-bg` | the unverified flag |
| `--ok` | the done tick |
| `--board`, `--board-ink`, `--board-mute`, `--tile`, `--tile-ink` | the landing board |
| `--measure`, `--wrap` (optional) | line length; page width (60rem) |

Figure tokens (read by `kit.js`, `figures.js` and the `f-*` SVG classes; override them inside each
room so a drawing adapts to the room it sits in):

| Token | Role |
|---|---|
| `--f-bg` | the drawing's background plate |
| `--f-ink`, `--f-text`, `--f-mute` | lines and labels on the plate; labels on controls; minor labels |
| `--f-ctl`, `--f-ctl-line` | a control's fill and outline |
| `--f-lit`, `--f-lit-text` | pressed or active, and text on it (usually the signal) |
| `--f-alt`, `--f-alt-text` | a second group the caption names |

Per room: `--win-label` (the success lead-in, e.g. `"You will hear it when: "`), and usually
`--ink-soft` and `--link` for a dark room.

## 4. The two instances

| | SP-404 × Deluge | Course patterns |
|---|---|---|
| Subject | a sampler and a groovebox, played live | making teaching pages |
| Page / ink | tin `#d3d5d1` / `#1a1c1e` | workshop grey `#e4e8e5` / green-black `#0f2620` |
| Signal | pad amber `#ff8a1f` | mat yellow `#f0c02f` |
| Room one | Lab: graph paper, blue ink | Draft: tracing vellum, blue grid |
| Room two | Stage: black body, amber | Try: cutting-mat green, yellow rulings |
| Type | Archivo, expanded headings, condensed labels | Archivo, condensed display |
| Files | *(in the learner's project, not published)* | `examples/patterns/site/assets/identity.css` |
