# Product

## Register

product

## Users

Adult learners of German at roughly A1 to B1, on an Android phone, in short
sittings (a commute, a break, the evening). They already know a fair amount of
vocabulary and some conjugation; what keeps breaking is where words go. Most
have met terms like "Vorfeld" or "Satzklammer" either never or only in a
textbook table they did not absorb. They open Klammer for ten sentences at a
time, and the first session is also their first contact with the field model.

## Product Purpose

Klammer drills German word order and nothing else. A sentence arrives as
scrambled chunks; the learner places them into the topological fields
(Vorfeld, linke Klammer, Mittelfeld, rechte Klammer, Nachfeld) and checks.
Every grammatical order is accepted, and the app says what an alternative
order changes. Success looks like a learner who, after a few weeks, sees the
bracket in any German sentence and stops putting the verb in the wrong place.

## Brand Personality

Precise, calm, quietly confident. A slate board in a dim room, chalk-white
type, tiles like type slugs, and one brass arc that closes when the sentence
is right: a composing stick, not a classroom. Feedback explains rather than
judges; failing is quiet.

## Anti-references

- Duolingo and its imitators: mascots, hearts, XP, gems, streak pressure,
  confetti, celebratory noise.
- Grammar-table apps that mark exactly one order right and every other
  (correct) order wrong.
- Pastel, rounded, childlike "learning app" styling: pill chips, bubbly
  illustrations, green ticks and red crosses.
- Dense textbook presentation: rule boxes before the learner has touched
  anything.

## Design Principles

1. **The board is the lesson.** Structure is taught by what the board shows
   and how it responds, before any text explains it.
2. **Never tell a learner correct German is wrong.** Three verdicts, not two;
   explain what changed rather than marking it down.
3. **Obvious in the first ten seconds.** A first-time learner knows what to
   tap, where it can go, and how to check, without reading a manual.
4. **German first, English as a crutch the learner can put down.** Every
   instruction and verdict is bilingual until the learner turns the gloss off.
5. **One signature moment.** The bracket closing is the only orchestrated
   animation; everything else answers touch directly.

## Accessibility & Inclusion

WCAG AA contrast as a floor (asserted in `src/theme/contrast.test.ts`).
Tap-to-place is fully equivalent to dragging. Every tile and field has a
German screen-reader label. Dynamic type to 200% without truncation. Colour
never carries meaning alone. Reduced motion is honoured in every animated
component. Touch targets at least 48 points.
