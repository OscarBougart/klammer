# Klammer — Design

German word order, one sentence at a time.

**Working name:** Klammer (alternatives: Vorfeld, Satzbau, Feldweg)
**Package:** `com.carbonelk.klammer`
**Platform:** Android first (Google Play), iOS later
**Price:** Free. No ads, no accounts, no network, no IAP.
**Session:** 10 sentences, 10–14 minutes.

---

## 1. Why this exists

Word order is the error that survives longest. Learners reach B2 vocabulary
while still writing *"Ich habe gestern ins Kino gegangen mit meiner Frau"* —
every word correct, every word in the wrong place. Grammar apps teach cases and
conjugation because those are easy to mark. Almost nobody drills position.

The reason is that position is hard to mark: German usually allows several
correct orders. Most apps dodge this by accepting exactly one. Klammer accepts
all of them, and tells you what changed in meaning when you pick a different one.

**One job:** put German constituents in valid positions, automatically.

---

## 2. The core idea: the board is the Feldermodell

The topological field model is how German syntax is actually described. It maps
directly onto a game board:

```
┌───────────┬─────────┬──────────────────┬──────────────┬──────────┐
│  Vorfeld  │  linke  │    Mittelfeld    │    rechte    │ Nachfeld │
│           │ Klammer │                  │   Klammer    │          │
├───────────┼─────────┼──────────────────┼──────────────┼──────────┤
│  Morgen   │  hole   │ ich meine        │     ab       │          │
│           │         │ Schwester vom    │              │          │
│           │         │ Bahnhof          │              │          │
└───────────┴─────────┴──────────────────┴──────────────┴──────────┘
              ╰────────────── Klammer ──────────────────╯
```

The two bracket halves are the heart of German. `hole … ab`, `habe … abgeholt`,
`muss … abholen`, `weil … abholen muss`. Once a learner sees the bracket, half
of German word order stops being arbitrary.

### The board grows

Tiers unlock zones. This is both the difficulty curve and the syllabus.

| Tier | Name | Board | Teaches |
|---|---|---|---|
| 1 | Position zwei | Vorfeld · FIN · Rest | Finite verb is always second |
| 2 | Die Klammer | + rechte Klammer | Separable prefixes, Perfekt, modals |
| 3 | Das Mittelfeld | Mittelfeld subdivides | TeKaMoLo, pronoun order, negation |
| 4 | Der Nebensatz | linke Klammer = conjunction | Verb-final clauses |
| 5 | Das Nachfeld | + Nachfeld | Extraposition, comparisons, marked order |

A learner on tier 1 never sees five zones. The board is honest about how much
structure is currently in play.

---

## 3. Mechanic

1. A scrambled sentence arrives as tiles in a tray at the bottom.
2. Drag tiles into slots on the board. Tap-to-place also works (accessibility,
   and faster for most people).
3. Slots accept anything. The board never blocks a wrong placement — being
   wrong must be possible or nothing is being tested.
4. **Prüfen** validates.
5. Feedback (§5), then next sentence.

### Tiles are chunks, not words

`ins Kino` is one tile. `meine Schwester` is one tile. `sehr langsam` is one
tile.

This app tests position, not case or agreement — splitting `ins Kino` would test
preposition choice instead, and would make a 7-word sentence a 5,040-permutation
puzzle. Chunk boundaries are constituent boundaries, authored by hand.

Exception: the right bracket. `abholen müssen` stays as two tiles, because their
internal order is exactly what tier 4 teaches.

### Capitalisation must not leak the answer

If a tile reads `Morgen`, the learner knows it goes first. So tiles render in
**neutral form**: lowercase unless the word is a noun or a name. The first tile
placed in the Vorfeld auto-capitalises with a small, visible flip animation —
which quietly teaches that German capitalises sentence-initially regardless of
what goes there.

---

## 4. Validation

### Build-time expansion, runtime lookup

Each sentence is authored once as an ordered list of role-tagged chunks. A
build script expands it into every valid arrangement, classifies each, and emits
a hash set. The app ships the set. Runtime validation is:

```
hash(userOrder) ∈ sentence.acceptedHashes
```

O(1), offline, no parser on device, no API cost. This is the only way "accept
any valid order" and "fixed curated bank" coexist.

### Three verdicts, not two

| Verdict | Meaning | Feedback |
|---|---|---|
| **Kanonisch** | The most neutral order | Bracket closes, brass |
| **Auch richtig** | Fully grammatical, different emphasis | Bracket closes + a line on what shifted |
| **Möglich, aber ungewöhnlich** | Grammatical but marked or stilted | Bracket closes in a dimmer brass + a note |
| **Falsch** | Ungrammatical | Bracket stays open, the broken rule is named |

That third tier is the whole reason to build this app. *"Vom Bahnhof hole ich
meine Schwester morgen ab"* is not wrong — it's a sentence that answers the
question "where from?". Telling a learner that is worth more than a red X.

### Generation rules (v1)

- Exactly one constituent in the Vorfeld. Candidates: subject, temporal, local,
  directional, causal, accusative object, dative object. Never: negation, bare
  unstressed pronoun objects, the finite verb.
- Finite verb fixed in the left bracket for declaratives.
- Right bracket internal order is fixed per construction.
- Mittelfeld: pronouns precede full noun phrases; among pronouns NOM > AKK >
  DAT; among full NPs DAT > AKK unless the accusative is pronominal.
- Adverbials default TeKaMoLo; reorderings are generated as *marked*.
- Negation immediately before the right bracket, after most Mittelfeld material,
  before predicatives and directionals.

Every generated set is reviewed by a human before freezing. The script prints
the set; the author vetoes anything that reads badly. Rules propose, the author
disposes.

---

## 5. Feedback

Wrong answers name the rule, not the position:

> Das finite Verb steht im Hauptsatz immer an zweiter Stelle.
> *Finite verb is second in a main clause.*

Then the board animates the one tile that has to move. Not a full reshuffle —
one tile, one move, so the learner sees the delta.

Right answers with an alternative:

> Auch richtig. Mit **morgen** im Vorfeld liegt die Betonung auf dem Zeitpunkt.

Both languages, always. German first, English underneath in the muted tone. A
learner who can read the German alone will stop reading the second line on their
own.

---

## 6. Visual design

### Direction

A slate board in a dim room. Chalk-white type, tiles like type slugs with hard
shadows, and one brass arc that closes when the sentence is right. The reference
is a composing stick, not a classroom — you are setting a sentence, and it locks.

Dark by default, which is unusual for a learning app and correct here: the
fields and the bracket read as a diagram, and diagrams belong on dark grounds.
A light theme exists and is well-made, but dark is the shipping default.

### Palette

| Token | Hex | Use |
|---|---|---|
| `schiefer` | `#1B2430` | Board ground |
| `feld` | `#232F3D` | Field zones, tile tray |
| `kante` | `#111823` | Hard tile shadow, field edges |
| `kreide` | `#E8E4D9` | Primary type, tile faces |
| `grau` | `#8A97A6` | Field labels, English gloss, secondary |
| `messing` | `#E4B363` | The Klammer arc, finite verb, success |
| `ziegel` | `#C96A6A` | Error state only |

Seven values. `messing` and `ziegel` never appear together. Success is not
green — success is the arc completing in brass. No other app does this and it
means something.

### Typography

- **Bricolage Grotesque** — tiles, field labels, numerals. Variable; slightly
  condensed forms survive German compounds without going narrow-and-sad.
  Tiles use the display optical size at weight 600.
- **Atkinson Hyperlegible** — explanations, glosses, all running text. Designed
  for maximum letterform disambiguation, which is what you want when someone is
  reading a language they don't own yet.

Scale: 13 / 15 / 17 / 21 / 28 / 40. Tiles at 21, explanations at 15, field
labels at 13 with loose tracking. Sentence case everywhere; no all-caps labels.

### Tiles

- Radius 6. Not pill-shaped — pills read as chips, and these are objects.
- Hard offset shadow: 2px down, 0 blur, `kante`. No soft blur anywhere in the
  app. Lifted tile goes to 5px offset and 1.04 scale.
- Face `kreide`, type `schiefer`. The finite-verb tile face shifts to `messing`
  once correctly placed — before the full check — so the anchor is visible.

### Motion

One orchestrated moment: **the bracket closing.** When both halves are filled
correctly, the arc draws left-to-right over 420ms with a slight overshoot at the
end, and one sharp haptic lands on arrival. Nothing else in the app has a
signature animation.

Everything else answers a touch directly: tiles lift, snap, and settle with
spring physics (Reanimated, `damping: 18, stiffness: 220`). Snap is 110ms and
carries a light haptic. Wrong answers shake the offending tile 3px, twice, 90ms
— no screen flash, no full-board shake.

Respect `prefers-reduced-motion`: arc appears without drawing, springs become
120ms fades, shake becomes a static outline.

### Sound

Off by default. When on: a short wooden click on snap, a low brass tone on the
bracket close. Nothing else. No failure sound — failing should be quiet.

---

## 7. Session and progression

**A session is ten sentences.** Fixed. No endless mode, no "just one more."
Finishing shows a board of the ten sentences you built, tappable to review.

**No timer during a puzzle.** Timing pressure degrades the exact processing this
app trains.

**Streak, gently.** A seven-day week strip, not a number that climbs to 400. One
missed day greys out; two missed days reset. A missed day can be repaired by
doing two sessions the next day. This is the one place where Duolingo's design
does active harm and it costs nothing to avoid it.

**Tier advance** requires 8/10 canonical-or-valid across three consecutive
sessions. Advancement is announced as a new zone appearing on the board, with a
30-second explanation of what that zone does.

**Review queue.** Sentences answered wrong return after 1, 3, and 10 days.
Simple SM-2-lite; no need for full spaced repetition here.

---

## 8. Content

- **520 sentences at launch**, hand-authored:
  tier 1: 120 · tier 2: 120 · tier 3: 130 · tier 4: 100 · tier 5: 50
- Vocabulary capped at the Goethe A1–B1 lists so word order is the only
  difficulty.
- Register: everyday spoken German. Real sentences people say, not
  *Der Lehrer gibt dem Schüler das Buch*.
- Every sentence carries: chunks with roles, canonical order, generated
  accepted set (post-veto), an English gloss, and the rule id it exercises.
- Content is a versioned JSON seed shipped in the binary and hydrated into
  SQLite on first launch. Bumping the seed version migrates additively and never
  drops progress.

---

## 9. Deliberately not in v1

Leaderboards. Hearts or lives. XP and a shop. A mascot. Social anything.
Accounts. Cloud sync. Ads. Push notifications beyond one optional daily
reminder that can be declined forever. Speaking or listening. Typed input
(that's Diktat's job). Vocabulary teaching. Case drilling.

Every one of these is a reason for a Play Store declaration, a permission, a
privacy policy clause, or a review delay. The app collects nothing and requests
no permissions except optional local notifications — Data Safety declares no
data collected, which is the fastest path through review.

---

## 10. Accessibility floor

- Tap-to-place is fully equivalent to drag; the whole game is playable without
  a drag gesture.
- Every tile and slot has a screen-reader label naming its content and current
  field.
- Contrast: `kreide` on `schiefer` is 12.4:1; `messing` on `schiefer` is 7.9:1;
  `grau` on `schiefer` is 4.7:1 and is never used below 15px.
- Dynamic type to 200%; tiles wrap to two lines rather than truncating.
- Colour never carries meaning alone — the arc's shape carries success, the
  named rule carries failure.

---

## 11. Open questions

- Does tier 5 (Nachfeld) earn its place, or should launch stop at tier 4 and
  add it in 1.1 once real usage shows whether anyone gets there?
- Should the English gloss be hideable in settings for learners who want
  German-only?
- Is 520 sentences enough for a committed user, or does v1.1 need a second
  pack? Measure: sessions-to-exhaustion in the closed test.
