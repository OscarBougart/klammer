# Klammer — Epics

Ten epics. E0–E5 are the playable core; E6–E9 are what makes it shippable and
worth keeping. Suggested cut line for a closed test is marked at the end.

---

## E0 — Scaffold

Get an empty app running on the stack with the theme in place.

- **E0.1** Init from `app-factory-template`, strip Supabase and auth entirely
- **E0.2** `src/theme/` with the full token set from design.md §6; lint rule
  banning hex literals outside that folder
- **E0.3** Load Bricolage Grotesque and Atkinson Hyperlegible; type scale
  helpers; verify umlauts and ß render at every weight
- **E0.4** Drizzle schema + migrations: `sentences`, `attempts`, `progress`,
  `review_queue`
- **E0.5** `eas.json`, `android.package`, preview build profile, one successful
  build on a real device

**Done:** blank screen, correct fonts, correct background, installs from EAS.

---

## E1 — Content model and the expander

The riskiest epic. Build it first and prove it before any UI exists.

- **E1.1** YAML sentence schema: chunks with `surface`, `neutralSurface`,
  `role`, plus `canonical`, `gloss`, `ruleId`, `tier`, `extraAccepted`
- **E1.2** Role vocabulary: SUBJ, FIN, INF, PTKVZ, AKK, DAT, PRON_NOM,
  PRON_AKK, PRON_DAT, TEMP, KAUS, MODAL, LOK, DIR, NEG, PRAED, KONJ
- **E1.3** `scripts/expand.ts` — generate permutations per design.md §4
- **E1.4** Classifier: `kanonisch` / `gueltig` / `ungewoehnlich` / rejected
- **E1.5** Author review CLI — prints the generated set per sentence, accepts
  keep/veto, writes vetoes back to the YAML
- **E1.6** Stable order hashing; emit `seed.json`; `content:verify` fails on
  stale seeds
- **E1.7** Test corpus: 40 hand-checked sentences with hand-written expected
  sets. **This is the acceptance gate for the whole epic.**

**Done:** all 40 test sentences produce exactly the expected accepted sets, with
no false rejections of valid German.

---

## E2 — The board

- **E2.1** Field zone layout; zones driven by tier, not hardcoded
- **E2.2** Slot components, flexible width, wrap to two lines
- **E2.3** Tile component: faces, hard shadow, neutral-surface rendering
- **E2.4** Drag layer with Reanimated + Gesture Handler; lift, follow, drop
- **E2.5** Snap physics and reflow when a tile lands between two others
- **E2.6** Tap-to-place as a full equivalent path
- **E2.7** Tile tray with reflow on removal
- **E2.8** Vorfeld auto-capitalisation with the flip animation

**Done:** a sentence can be arranged completely by drag and completely by tap,
on a small phone and a tablet, with no layout breakage on long compounds.

---

## E3 — Validation and feedback

- **E3.1** Wire the board to the engine; Prüfen returns a verdict
- **E3.2** The Klammer arc: SVG path, draw animation, overshoot, haptic
- **E3.3** Four verdict presentations per design.md §5
- **E3.4** Rule explanation strings, German + English gloss, keyed by `ruleId`
- **E3.5** Single-tile correction animation — move only the tile that must move
- **E3.6** Error shake; no screen flash
- **E3.7** Reduced-motion variants for every one of the above

**Done:** all four verdicts reachable and visually distinct; arc closes only on
a correct bracket.

---

## E4 — Session loop

- **E4.1** Ten-sentence session; selection weighted by tier and review queue
- **E4.2** Progress indicator, no timer
- **E4.3** Result screen: the ten sentences you built, tappable to review
- **E4.4** Attempt persistence
- **E4.5** Review queue at 1 / 3 / 10 days
- **E4.6** Resume a session interrupted mid-way

**Done:** a full session can be played, closed, reopened, and reviewed.

---

## E5 — Progression

- **E5.1** Tier state machine; advance on 8/10 across three sessions
- **E5.2** Zone-unlock moment: the new field appears on the board with a
  30-second explanation
- **E5.3** Week strip streak with repair-by-double-session
- **E5.4** Home screen: today's session, streak, current tier
- **E5.5** Settings: theme, sound, haptics, gloss visibility, reminder

**Done:** a new install can reach tier 3 through normal play with no dead ends.

---

## E6 — Content authoring

- **E6.1** Tier 1 — 120 sentences
- **E6.2** Tier 2 — 120 sentences
- **E6.3** Tier 3 — 130 sentences
- **E6.4** Tier 4 — 100 sentences
- **E6.5** Tier 5 — 50 sentences
- **E6.6** Native-speaker review pass over the full bank
- **E6.7** Vocabulary audit against Goethe A1–B1

**Done:** 520 sentences, all reviewed, all with vetted accepted sets.

> Biggest time sink in the project by a wide margin. Start it in parallel with
> E2 and treat E1.7 as the thing that unblocks it.

---

## E7 — Polish

- **E7.1** Light theme, fully specified not auto-inverted
- **E7.2** Sound: wooden click, brass tone; off by default
- **E7.3** App icon, splash, Play feature graphic
- **E7.4** Empty and edge states — bank exhausted, all reviews cleared
- **E7.5** First-run: three screens explaining the bracket, skippable
- **E7.6** Performance pass — 60fps drag on a low-end device

---

## E8 — Accessibility

- **E8.1** Screen-reader labels on tiles and slots naming content and field
- **E8.2** Full screen-reader playthrough of a session
- **E8.3** Dynamic type to 200%, tiles wrap not truncate
- **E8.4** Contrast audit against design.md §10
- **E8.5** Reduced-motion audit across every animated component

---

## E9 — Release

- **E9.1** Play Console listing, screenshots, short and full description
- **E9.2** Data Safety: no data collected — verify against the dependency tree
- **E9.3** Content rating questionnaire
- **E9.4** Privacy policy (Termly, as with Dram)
- **E9.5** Closed testing track, 12+ testers, 14-day run
- **E9.6** Measure sessions-to-exhaustion; decide whether v1.1 needs a pack
- **E9.7** Production rollout, staged

---

## Cut line

Closed test needs **E0–E5, E6.1–E6.3, E8.1, E8.3, E9.1–E9.5**. That is three
tiers of content and roughly 370 sentences — enough to learn whether the
mechanic holds attention for a fortnight, which is the only question a closed
test can answer.

Tier 5 and the light theme can both slip to 1.1 without anyone noticing.

---

## Risks

| Risk | Why it matters | Mitigation |
|---|---|---|
| Expander accepts an ungrammatical order | Grammar app teaching wrong German — fatal | E1.7 gate + human veto on every set |
| Expander rejects a valid order | Learner is told correct German is wrong — nearly as bad | `extraAccepted` escape hatch; log every rejection in the closed test |
| Content authoring stalls | 520 reviewed sentences is weeks of work | Ship at 370; author tiers in order so each is independently shippable |
| Drag performance on low-end Android | The whole product is one gesture | Reanimated worklets only, no JS-thread layout during drag; test on a cheap device from E2.4 onward |
| Chunking makes puzzles trivial | Too few tiles = guessable | Minimum 5 tiles per sentence from tier 2 up |
