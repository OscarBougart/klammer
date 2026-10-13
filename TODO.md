# Klammer — what is left

State as of 2026-10-13, branch `feat/core-and-sdk57` (PR #1). The 2026-10-06
work is committed as `02dbbb7` (not pushed).

## 1. Broken: fix first

- **Fixed, uncommitted, not yet seen on a device (2026-10-13):**
  - Bank tiles overlapped or stayed indented after a tap-out: the layout
    transition and the drag transform shared one view
    (`src/board/DraggableTile.tsx`). Now split into two.
  - The bank jumped up when the hint above it disappeared, so the next tap
    missed. The hint now sits under the bank (`src/board/Board.tsx`).
  - Home sample card, Stufe 4/5: the bracket vanished or was drawn under the
    wrong line when the sentence wrapped. Now the ends are marked and named
    when it wraps, and Stufe 5 names the Nachfeld
    (`components/SampleSentence.tsx`).
- Settings: done. Sound and Daily reminder were removed; Light theme,
  Vibration and the English gloss all work.

## 2. Housekeeping

- Push `02dbbb7` and the fixes; PR #1's description does not mention the UX
  work.
- 6 Expo packages are a patch behind (`npx expo install --fix`).
- `.vscode/` is untracked; add it to `.gitignore`.
- Web preview (`expo start --web`) still does not boot: expo-sqlite's
  worker needs a cross-origin-isolated page. Low priority; test on Android.

## 3. Check on a real phone

Seen on the Pixel 7 emulator 2026-10-11: Home (Stufe 1, 3, 4, 5 cards), the
intro, a wrong answer in a session (verdict, Nochmal, Lösung zeigen, Weiter all
fit). Still to check:

- The three fixes above.
- Tier 2+ board: the bracket in the field view, drawn in brass on a correct
  answer.
- With reduced motion off: tile lift, flip to capital, bracket draw.
- Large text (200%), TalkBack pass over the board and verdict.
- Result screen, tier-unlock screen and Settings.
- Stufe 4/5 boards: the lead-in line above a subclause, the Nachfeld field
  after Prüfen.

## 4. UX to improve

- Disabled Prüfen is a muddy brown with low-contrast text.
- Large empty area between the bank and Prüfen on a tall phone.
- Tier-unlock screens (2–5) still use the old static board; bring them in
  line with the intro (a guided example sentence).
- A "Fertig für heute" exit is still an option if 5 sentences feels long.

## 5. Content and grammar

- **392 of 522 sentences are `verified: false`** (all of tiers 4 and 5, plus
  240 older ones). A German speaker must read them before the closed test
  (see `GERMAN-REVIEW.md`, "Verification status"). This is the release
  blocker.
- Open questions for the reviewer in `GERMAN-REVIEW.md`: accusative-first
  across a time phrase, and with an indefinite accusative, labelled
  `gueltig`.
- Generator (`src/content/generate.ts`) still swaps across `nicht` in some
  shapes; a bank test catches it but the generator is not fixed.
- Generator never produces a bare object after a place phrase (`Sie kauft
  auf dem Markt Gemüse`); t1-70 and t1-105 use `extraAccepted` instead.

## 6. Google Play release

Developer account: **done**. 12 closed-test testers: **ready**.

App
- [ ] Commit the three fixes after a look on a phone.
- [x] App icon + splash (2026-10-13, uncommitted): flat brass verb tile, long
      chalk tile, bracket under them; `npm run icons` regenerates them from
      the tokens. Only visible in a real build — Expo Go shows its own.
- [x] Expo packages aligned with SDK 57 patches (`d70a930`).
- [x] Android Auto Backup off (`allowBackup: false`), so "nothing leaves the
      device" holds.

Build
- [ ] `eas init` to link the project (no projectId in `app.json` yet).
- [ ] Preview build (`npm run build:preview`), played on a real phone (E0.5).
- [ ] Production `.aab` with Play App Signing.

Play Console
- [ ] Privacy policy: page written (`docs/privacy.html`). Needs the contact
      email filled in, then GitHub Pages turned on (main branch, `/docs`).
- [x] Store text in `RELEASE.md` rewritten for the current app.
- [x] Feature graphic: `assets/store/feature-graphic.png` (`npm run icons`).
- [ ] 2–8 phone screenshots, from the first real build (plan in `RELEASE.md`).
- [ ] Data safety form: no data collected (`DATA-SAFETY.md`).
- [ ] Content rating questionnaire (`RELEASE.md`); confirm after the German
      review.
- [ ] Target audience 13+ (keeps the app out of the Families programme).
- [ ] Ads: no · App access: no login · contact email.

Testing
- [ ] Internal track first.
- [ ] Closed test, 12 testers × 14 days.
- [ ] Apply for production access, then roll out.
