# Klammer — what is left

State as of 2026-10-06, branch `feat/core-and-sdk57` (PR #1).

## 1. Broken: fix first

- **Board redesign (2026-09-27, uncommitted):** words are built in one row
  (tap = add to end, tap in row = back to the bank, drag = insert where
  dropped); fields appear only after Prüfen, split from the learner's own
  order (`src/board/segment.ts`). Drag now measures the row at drop time,
  which fixed the drop that never landed. Checked on the Pixel 7 emulator
  (tier-1 intro). Still to check: a tier-2 sentence (bracket in the field
  view), large text, TalkBack.
- **Settings:** done. Sound and Daily reminder were removed; Light theme,
  Vibration and the English gloss all work.

- **Home redesign (2026-09-27, uncommitted):** sample sentence card, level
  path (every Stufe with sentences can be played; only the learner's own
  Stufe counts toward moving up — changed 2026-10-06), gear
  for settings. Checked on the emulator at Stufe 1 and (temporarily forced)
  Stufe 3. The Expo Go dev button sits over the gear on the emulator, so the
  gear tap itself is untested there.

## 2. Housekeeping

- 7 local commits are not pushed (from `8690164` to `eb92700`); PR #1's
  description does not mention the UX work.
- `.vscode/` is untracked; add it to `.gitignore`.
- A stray `expo start --port 8082` may still be running; stop it.
- Web preview (`expo start --web`) still does not boot: expo-sqlite's
  worker needs a cross-origin-isolated page. Low priority; test on Android.

## 3. Check on a real phone (built, never seen on a device)

- Tier 2+ board: the side bracket lines up with the Linke/Rechte Klammer
  fields, and draws in brass on a correct answer.
- A wrong answer: verdict, "Nochmal", "Lösung zeigen", "Weiter" all fit;
  the board scrolls when it does not fit and the verdict is scrolled into
  view.
- With reduced motion off (the emulator had it on): tile lift, flip to
  capital in the Vorfeld, bracket draw.
- Large text (200%), TalkBack pass over the board and verdict.
- Result screen, tier-unlock screen and Settings with the new buttons.

## 4. UX to improve

- Session length: now 5 sentences, a good round 4 of 5 (2026-10-06). A
  "Fertig für heute" exit is still an option if 5 feels long.
- Tier-unlock screens (2–5) still use the old static board; bring them in
  line with the intro (a guided example sentence).
- Tapping a tile in the tray while another is selected just switches the
  selection; fine, but worth checking it reads as intended.
- Result screen: wrong answers now come first, the first one opened.
- Intro/board: the word bank now sits under the row instead of at the foot
  of the screen. Check on a short phone that Prüfen and the bank still fit.

## 5. Content and grammar

- **392 of 522 sentences are `verified: false`** (all of tiers 4 and 5 are
  new drafts). A German speaker must
  read them before closed testing (see `GERMAN-REVIEW.md`, "Verification
  status"). This is the release blocker.
- Open questions for the reviewer in `GERMAN-REVIEW.md`: accusative-first
  across a time phrase, and with an indefinite accusative, labelled
  `gueltig`.
- Generator (`src/content/generate.ts`) still swaps across `nicht` in some
  shapes; a bank test catches it but the generator is not fixed.
- Generator never produces a bare object after a place phrase (`Sie kauft
  auf dem Markt Gemüse`); t1-70 and t1-105 use `extraAccepted` instead.
- Tiers 4 and 5 drafted (102 + 50, 2026-10-06). Not yet seen on a device:
  the lead-in line above a subclause, the Nachfeld field after Prüfen, the
  Home sample card at Stufe 4 and 5.

## 6. Release (RELEASE.md)

- E0.5: one successful EAS build on a real device.
- E7.3: icon, feature graphic, screenshots.
- Privacy policy at a public URL.
- Confirm the content rating once the bank is verified.
