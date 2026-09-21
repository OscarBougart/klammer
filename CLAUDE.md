# CLAUDE.md

Klammer — a German word-order puzzle game. Drag role-tagged chunks into the
topological field model (Vorfeld / linke Klammer / Mittelfeld / rechte Klammer /
Nachfeld). Read `design.md` before changing game logic or visuals.

## Stack

Expo SDK 54 · Expo Router v6 · TypeScript strict · NativeWind v4 · Zustand ·
expo-sqlite + Drizzle · Reanimated 4 · Gesture Handler 2 · expo-haptics

Package manager is **npm** (`--legacy-peer-deps` for anything outside the Expo
SDK; `npx expo install` for anything inside it).

No Supabase. No network calls. No auth. If a task seems to need a backend, stop
and ask — it almost certainly doesn't.

## Commands

```bash
npm start             # dev
npm run lint          # eslint + tsc --noEmit — must pass before any commit
npm test              # vitest
npm run content:expand   # regenerate accepted-order sets from authored sentences
npm run content:verify   # fail if any sentence's seed is stale vs its source
npm run build:preview    # eas build -p android --profile preview
```

## Layout

```
app/                    expo-router routes
  (game)/session.tsx    the board
  (game)/result.tsx     end of session
src/
  board/                slots, tiles, drag layer, the Klammer arc
  engine/               validation, hashing, verdicts
  content/              seed loader, SQLite hydration, review queue
  store/                zustand slices
  theme/                tokens — the only place hex values may appear
                        tokens.json holds the primitives (tailwind reads it too)
  db/                   drizzle schema + client
content/
  sentences/*.yaml      authored source of truth (human-edited)
  generated/seed.json   build output — NEVER hand-edit
scripts/
  expand.ts             permutation generation + classification
```

## Rules

**Tokens.** Never write a hex value, font name, spacing number or duration
outside `src/theme/`. Import from tokens, or use the NativeWind classes
(`bg-schiefer`, `text-kreide`, `font-display`, `p-lg`) that
`tailwind.config.js` derives from `src/theme/tokens.json`. The eslint rule
`no-restricted-syntax` fails the build on a hex literal anywhere else. The one
exception is `app.json`, where the splash and adaptive-icon colours have to be
literal — keep them equal to `schiefer`.

**Content.** `content/generated/seed.json` is build output. Edit the YAML and
run `npm run content:expand`. A PR touching generated/ by hand gets rejected.

**Validation is a lookup.** `engine/` hashes the user's chunk order and checks
set membership. Do not write a grammar parser, do not call an LLM at runtime, do
not add per-sentence special cases. If a sentence needs an order the generator
won't produce, the fix is in `scripts/expand.ts` or in the sentence's
`extraAccepted` field — never in engine code.

**Chunks are constituents.** One tile = one constituent. Never split a
preposition from its noun phrase. The one exception is the right bracket, where
each verbal element is its own tile.

**Neutral surfaces.** Tiles store `surface` and `neutralSurface`. Render
`neutralSurface`; capitalise on placement into the Vorfeld. Never render a tile
in a form that reveals its position.

**Slots never reject.** A wrong placement must be possible. Validation happens
only on Prüfen.

**Motion.** Only the Klammer arc has a scripted animation. Everything else is a
direct response to touch. Check `useReducedMotion()` in every animated
component — no exceptions.

**Haptics.** `selectionAsync` on lift, `impactAsync(Light)` on snap,
`impactAsync(Medium)` on the arc closing. Nothing on error.

## German correctness

This is a grammar app; a wrong sentence in the seed is a product defect, not a
typo. When adding or editing sentences:

- Vocabulary stays inside Goethe A1–B1.
- Every sentence must be something a person would actually say.
- Never mark a grammatical order as wrong. When unsure whether an order is
  valid, mark it `ungewoehnlich` rather than excluding it.
- Umlauts and ß are written literally in YAML, never escaped or transliterated.

## Play Store constraints

Package `com.carbonelk.klammer`. Data Safety declares **no data collected** —
keep it true. Adding any analytics, crash reporting with PII, ad SDK, or network
call breaks that declaration and triggers re-review. Raise it before adding a
dependency that touches the network.

`eas.json` and `android.package` must stay present and correct. Target SDK
follows the current Play requirement; check before each release build.

## Definition of done

`npm run lint` clean · `npm test` green · `npm run content:verify` green · reduced
motion handled · screen-reader labels on new interactive elements · no new
permissions.
