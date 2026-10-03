# Klammer — what is left

State as of 2026-09-25, branch `feat/core-and-sdk57` (PR #1).

## 1. Broken: fix first

- **Board redesign (2026-09-27, uncommitted):** words are built in one row
  (tap = add to end, tap in row = back to the bank, drag = insert where
  dropped); fields appear only after Prüfen, split from the learner's own
  order (`src/board/segment.ts`). Drag now measures the row at drop time,
  which fixed the drop that never landed. Checked on the Pixel 7 emulator
  (tier-1 intro). Still to check: a tier-2 sentence (bracket in the field
  view), large text, TalkBack.
- **Three settings do nothing.** Light theme, Sound and Daily reminder are
  saved but nothing reads them. Either implement them or remove the
  switches (a reminder needs a notification permission, which changes the
  Play Data Safety answers; see CLAUDE.md).

- **Home redesign (2026-09-27, uncommitted):** sample sentence card, level
  path (tap a passed Stufe to practise; only the current Stufe counts), gear
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

- Session length: ten sentences may be too much for "practise a bit";
  consider 5, or a "Fertig für heute" exit that keeps what was answered.
- Tier-unlock screens (2–5) still use the old static board; bring them in
  line with the intro (a guided example sentence).
- Tapping a tile in the tray while another is selected just switches the
  selection; fine, but worth checking it reads as intended.
- Result screen: the list is long; consider showing only the wrong ones
  first.

## 5. Content and grammar

- **240 of 370 sentences are `verified: false`.** A German speaker must
  read them before closed testing (see `GERMAN-REVIEW.md`, "Verification
  status"). This is the release blocker.
- Open questions for the reviewer in `GERMAN-REVIEW.md`: accusative-first
  across a time phrase, and with an indefinite accusative, labelled
  `gueltig`.
- Generator (`src/content/generate.ts`) still swaps across `nicht` in some
  shapes; a bank test catches it but the generator is not fixed.
- Generator never produces a bare object after a place phrase (`Sie kauft
  auf dem Markt Gemüse`); t1-70 and t1-105 use `extraAccepted` instead.
- Tiers 4 and 5 (100 + 50 sentences) for the full 520.

## 6. Release (RELEASE.md)

- E0.5: one successful EAS build on a real device.
- E7.3: icon, feature graphic, screenshots.
- Privacy policy at a public URL.
- Confirm the content rating once the bank is verified.
