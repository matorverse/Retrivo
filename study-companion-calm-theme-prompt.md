# Calm & Composed UI/UX Overhaul — Design Prompt

Use this as a prompt for an AI coding assistant (Claude Code, Cursor, etc.) to restyle the app, or as your own design reference while building components.

---

## 1. Role & Context

You are restyling **Study Companion**, an existing Next.js + Tailwind app. The current UI is functional but generic. The goal is a calm, composed visual identity — soft, warm, low-saturation colors (light green, peach, beige), no neons, no harsh contrast, no decorative effects. The app should feel like a quiet, well-organized study space, not a flashy SaaS dashboard.

## 2. Design Objective

Every screen should feel unhurried and easy on the eyes during long study sessions. Prioritize: generous whitespace, soft muted color, clear hierarchy through spacing rather than heavy borders or shadows, and restraint — one accent color used sparingly beats five colors used everywhere.

## 3. Color Palette

Define these as CSS custom properties (or Tailwind theme extension) — do not hardcode hex values in components.

```css
:root {
  /* Base surfaces — warm beige, not stark white */
  --color-bg: #FAF6EF;          /* page background */
  --color-surface: #FFFFFF;      /* cards, panels */
  --color-surface-muted: #F3EDE1; /* subtle inset areas, hover states */

  /* Accents — soft sage green + peach */
  --color-primary: #93AE8B;      /* muted sage — primary actions, active states */
  --color-primary-hover: #7F9C76;
  --color-primary-tint: #E6EEE2; /* pale sage bg for badges/highlights */

  --color-secondary: #E8B894;    /* soft peach — secondary accents, warmth */
  --color-secondary-tint: #FBEBDC;

  /* Text — warm charcoal, never pure black */
  --color-text-primary: #33312B;
  --color-text-secondary: #74705F;
  --color-text-muted: #A19C8A;

  /* Borders */
  --color-border: #E6DFCF;
  --color-border-strong: #D6CBAE;

  /* Status — muted, not alarming */
  --color-success: #7A9B6E;      /* sage-leaning green */
  --color-success-tint: #E9F1E4;
  --color-warning: #D8A65C;      /* muted amber/peach */
  --color-warning-tint: #F7ECDA;
  --color-danger: #C97F6E;       /* soft terracotta, not fire-engine red */
  --color-danger-tint: #F5E5E0;
}
```

Rules for using these:
- Body text always uses `--color-text-primary` on `--color-bg`/`--color-surface` — this pair must meet WCAG AA (4.5:1). Verify contrast after any tweak; pastel palettes drift into failing contrast easily.
- Colored badges/pills: tinted background (`*-tint`) with the saturated version of the same color as text — never the tint color as text on itself, and never pure white/black on a tint.
- Only **one** saturated accent per screen for primary actions (default to sage). Peach is for secondary emphasis — a highlighted card, a "new" indicator — not for buttons competing with the primary action.

## 4. Typography

- Body font: a clean humanist sans (Inter, Karla, or system-ui) — readable at length, not geometric/cold.
- Optional: a soft serif (e.g., Lora or Source Serif) for page titles or the AI's answer text specifically, to add warmth and differentiate "the app's voice" from "the AI's voice" — mirrors how chat interfaces often use serif for assistant responses.
- Sentence case everywhere. No all-caps labels, no title case.
- Weight: regular (400) for body, medium (500) for emphasis. Avoid bold (700) — it reads harsh against a soft palette.
- Line height 1.6–1.7 for body text — generous leading reinforces the calm feel.

## 5. Layout & Spacing

- Base spacing unit: 8px. Use generous multiples (16px, 24px, 32px) between sections — don't cram.
- Card padding: minimum 20–24px, not the typical 12px.
- Corner radius: 10–14px on cards, 8px on buttons/inputs — soft but not pill-shaped/playful.
- Max content width ~720–840px for reading-heavy screens (chat, document view) — narrower columns feel calmer than edge-to-edge text.

## 6. Component Rules

- **Shadows**: none, or at most a 1px border in `--color-border`. No drop shadows, no glows.
- **Buttons**: primary = solid `--color-primary` fill with white/cream text; secondary = transparent with `--color-border` outline and `--color-text-primary` text. No gradients.
- **Inputs**: `--color-surface` background, 1px `--color-border`, focus state = 1px `--color-primary` border, no glowing focus rings.
- **Status badges**: tint background + saturated text, per palette rules above (ready = success, processing = warning, error = danger).
- **Navigation**: active item gets `--color-surface-muted` background, not a bold color block — should feel like a gentle highlight, not a selected-tab shout.
- **Icons**: outline style only (not filled/solid icons), `--color-text-secondary` by default, `--color-primary` when active.

## 7. Motion

- Transitions limited to opacity and color fades, 150–200ms ease-out. No bounce, no scale-pop, no slide-in flourishes.
- Loading states: a simple soft pulse or fade, not a spinning neon loader.

## 8. Explicitly Avoid

- Neon or highly saturated colors anywhere, including error states
- Gradients, glassmorphism, drop shadows, glow/blur effects
- Pure black text or pure white backgrounds (always warm off-white/charcoal)
- More than two accent colors visible on one screen at once
- Dense, bordered grids of cards — prefer single-column lists with breathing room where content allows

## 9. Apply To (in priority order)

1. Global theme tokens (Tailwind config or CSS variables) — do this first so every component inherits it automatically
2. Dashboard/document list screen
3. Chat/Q&A screen
4. Upload flow and empty states
5. Settings

## 10. Acceptance Criteria

- [ ] All colors sourced from theme tokens, zero hardcoded hex in component files
- [ ] Text contrast passes WCAG AA on every background it appears on
- [ ] No shadows, gradients, or saturated/neon colors anywhere in the app
- [ ] Visual hierarchy is achieved through spacing and one accent color, not multiple competing colors
- [ ] A screenshot of the dashboard, chat, and settings screens all clearly read as "the same calm app"
