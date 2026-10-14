# Patterns worth stealing

Techniques used in this codebase that transfer to any app. Each one: the idea,
why it matters, and where to see it working.

Read this when you want to know *why* the code is shaped the way it is.

---

## 1. Move work to build time, leave a lookup at runtime

**The move:** if answering a question at runtime is expensive, compute every
answer ahead of time and ship the result.

Klammer accepts many valid German word orders. Checking grammar on-device would
need a parser. Instead a build script generates every valid order, hashes each,
and ships a hash set. Runtime validation becomes one line:

```ts
// src/engine/validate.ts
return sentence.acceptedHashes[hashOrder(order)] ?? 'falsch';
```

O(1), offline, no API cost, no parser to maintain.

**Use it when:** the input space is finite and known in advance. Pricing tiers,
valid move sets, permission matrices, search indexes.

**The catch:** the build output and the code that reads it must agree forever.
Version the format (`HASH_VERSION`) and fail loudly when they drift.

---

## 2. Separate pure logic from the framework

**The move:** put decision-making in plain functions that import nothing from
React, React Native, or your database.

I learned this the hard way here. Drop-target maths lived in `dragContext.tsx`,
which imports Reanimated → React Native. React Native ships Flow syntax, so the
test runner couldn't parse it, so the *one part of the drag that can be tested*
was untestable. Splitting it into `geometry.ts` — no imports but types — made 10
tests possible.

```
src/board/geometry.ts      pure maths, tested in node
src/board/dragContext.tsx  React wiring, not tested
```

**Rule of thumb:** if a function takes data and returns data, it doesn't belong
in a component file.

---

## 3. Inject the clock and the randomness

**The move:** never call `Date.now()` or `Math.random()` inside logic you want
to test. Pass them in.

```ts
// src/content/review.ts
export function scheduleWrong(sentenceId: string, now: number): ReviewEntry
//                                                ^^^ passed in, not read
```

A scheduler that can't be tested at an arbitrary date gets tested in
production, on a real user's data. Same for shuffles — `selectSession` takes an
optional `shuffle` so a test can make sessions reproducible.

**Use it when:** anything involves time, randomness, or device state.

---

## 4. Assert invariants, don't silently filter

**The move:** when something *must* be true, throw if it isn't — don't quietly
skip the bad case.

The order generator once dropped a chunk, producing a sentence missing a word.
Filtering those out would have hidden the bug forever. Throwing exposed it:

```ts
// src/content/generate.ts
if (order.length !== sentence.chunks.length) {
  throw new Error(`[${sentence.id}] generated an order dropping chunk(s): …`);
}
```

**The distinction:** filtering says "this case is expected and fine". Throwing
says "this is impossible, and if it happened my logic is wrong". Use the one
you actually mean.

---

## 5. Verify your own output before you commit it

**The move:** when writing to something precious, re-read what you produced and
check it says what you intended.

The review CLI edits hand-authored YAML full of comments. A naive
parse-and-dump would strip every comment. So it patches text surgically — then
re-parses both versions and asserts only the intended keys changed:

```ts
// src/content/patch-yaml.ts — applyDecisions()
verify(result, document, sentenceId, decisions);  // throws rather than return
```

This caught a real bug immediately (relative vs absolute line offsets) that
would have corrupted content files.

**Use it when:** writing to user data, config files, or anything you can't
easily undo.

---

## 6. One source of truth, many consumers

**The move:** when two systems need the same constants, have both read one
file — don't mirror it.

Design tokens live in `src/theme/tokens.json`. `tokens.ts` types them for app
code; `tailwind.config.js` (CommonJS, can't import TS) reads the same JSON:

```js
const tokens = require("./src/theme/tokens.json");
colors: { transparent: "transparent", ...tokens.palette }
```

Note `colors` is **replaced**, not extended — so no stray Tailwind blue is even
reachable. Constraints work better than conventions.

**Use it when:** the same values appear in a config file and in code.

---

## 7. Give yourself an escape hatch, not special cases

**The move:** when a rule engine can't handle a case, add a data-level override
— never an `if` in the engine.

German grammar has edge cases the generator can't infer from two examples. The
fix isn't engine code; it's a field in the content:

```yaml
extraAccepted:
  - order: [dass, sie, morgen, mich, bhf, abh, muss]
    class: ungewoehnlich
```

The engine stays one lookup. The exception lives with the data it belongs to,
and a human signs for it.

**Use it when:** you feel the urge to write `if (id === 'special-case')`.

---

## 8. Things that must move together go in one transaction

**The move:** if two writes would corrupt state by diverging, make them atomic.

```ts
// src/content/repository.ts — recordAttempt()
await db.transaction(async (tx) => {
  await tx.insert(attempts).values(…);
  //  …and the review-queue update, in the same tx
});
```

An attempt saved without its review update would silently drop a sentence out
of rotation — a failure nobody notices and nobody recovers from.

**Ask yourself:** "if the app died between these two lines, what breaks?"

---

## 9. Dates are calendars, not arithmetic

**The move:** for anything user-facing about *days*, use local calendar dates,
not timestamp maths.

```ts
// src/content/dates.ts
shifted.setDate(shifted.getDate() - 1);  // handles month/year/DST rollover
```

Playing at 23:50 and 00:10 is two days. At 09:00 and 21:00 it's one day.
`now - 86400` gets both wrong, and differently per timezone. A local day can be
23 or 25 hours during daylight-saving changes.

**Use it when:** streaks, "daily" limits, calendars, anniversaries.

---

## 10. Type your JSON at the boundary

**The move:** don't let TypeScript infer types from JSON data — declare the
contract and cast once.

Importing `seed.json` directly made TS infer the shape from *whatever data
happened to be in it*. One sentence had no `matrix`, so `matrix` didn't exist as
a property, and the app stopped compiling when content changed.

```ts
// src/content/seed.ts
export type SeedSentence = { …; matrix?: string; … };
export const seed = raw as unknown as Seed;   // contract, not inference
```

The `as unknown` is not laziness. TypeScript infers a distinct literal type per
record — including an exact union of every key in the file — so a direct
`as Seed` stops overlapping once the data grows, and the app fails to compile
*because someone added content*. Going through `unknown` says plainly: this is
data, the type is the contract, and something else validates it.

**Use it when:** importing JSON, reading an API response, or parsing a file.

---

## 11. React Native specifics worth knowing

**Fonts don't pick weights on Android.** `fontWeight: '600'` on a custom family
gives you a *synthesised* fake bold. Register each weight as its own family and
name the face directly:

```ts
display: 'BricolageGrotesque_400Regular',
displaySemiBold: 'BricolageGrotesque_600SemiBold',
```

**Keep gestures off the JS thread.** Measure drop targets once at layout into a
shared value, then hit-test inside the worklet. Measuring on drop puts a
round-trip in the exact frame that needs to be smooth. JS hops at gesture
*start* and *end* are fine — per-frame ones are not.

**Pan inside ScrollView loses.** The scroll claims the gesture. Either remove
the scroll surface or require a long press — pick deliberately, because
long-press-to-drag changes how the app feels.

**Metro caches transforms.** After editing `babel.config.js`, run with
`--clear` or you'll debug a build that no longer exists.

---

## 12. Make the guard rail mechanical

**The move:** a rule nobody can enforce isn't a rule. Turn it into a lint error.

"No hex values outside `src/theme/`" is enforced by:

```js
// eslint.config.js
selector: `Literal[value=/^#(?:[0-9a-fA-F]{3,8})$/]`,
message: "No hex literals outside src/theme/. Import a token from @/theme.",
```

**Know the blind spots too.** That rule catches hex — not font names, not
spacing numbers. Both slipped past me repeatedly and were caught only by
reading. If a rule matters, either automate it or expect to break it.

---

## The through-line

Most of these are the same instinct in different clothes:

> **Make the failure loud, early, and close to the cause.**

Throw instead of filtering. Verify before writing. Inject the clock so tests
can reach the bug. Lint the rule you'd otherwise forget. The cost is a little
friction now; the alternative is a silent wrong answer shipped to someone
trying to learn German.
