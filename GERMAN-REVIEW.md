# What a German speaker needs to check

**Reviewed.** A German speaker has been through Priority 1 and 2, and most of
Priority 3. Their rulings are implemented; what follows records what changed
and what is still open.

The governing principle that came out of the review, and which now shapes the
whole generator:

> Almost nothing in the Mittelfeld is flatly ungrammatical. Most "wrong"
> orders simply need contrastive stress, which this app cannot show. So an
> order that only works under stress is **möglich, aber ungewöhnlich** — never
> **falsch**. The single exception is `es`, which cannot be stressed at all.

That one line replaced a set of case-by-case judgements, and it moved the app
decisively away from its worst failure mode: telling a learner that correct
German is wrong.

---

## Resolved and implemented

| Item | Ruling | Change |
|---|---|---|
| 1.1 bare object across a time phrase | Marked, **not wrong** | `Ich trinke Kaffee morgens` and `Wir haben einen Film gestern gesehen` now accepted as `ungewoehnlich`; two corpus rejects became accepts |
| 1.1 object across a manner phrase | Ordinary | `Sie spricht Deutsch sehr gut` is `gueltig` — manner already sits by the verb, so the object barely moves |
| 1.2 definite object vs time | Genuine tie; keep current rule | Unchanged. Both accepted, neither implied to be less normal |
| 1.3 object pronoun before a noun subject | Accept | Pronoun subjects retagged `PRON_NOM`; `Gestern hat mir der Mann das Buch gegeben` now generated as `gueltig`. Corpus entry `r13-01` |
| 1.4 / 1.7 pronoun out of slot | Marked, not wrong | Generator now produces them as `ungewoehnlich` with a stress note, instead of refusing |
| 1.5 negation and place | Confirmed | `NEG` rank moved 80 → 55, now before manner, place, direction and predicatives. It had been building `zu Hause nicht` |
| 1.6 two pronouns | `es dir` right, `dir es` wrong | Tier 3 stands unchanged |
| 1.6 two full objects | Accusative-first is emphasis, not error | `Ich gebe das Buch meinem Bruder` now generated as `gueltig` |
| P2 place fronting | Ordinary | `In Aachen wohne ich…` moved from `ungewoehnlich` to `gueltig` |
| P2 fronted object pronoun | Only under contrast | `Mir hat er…` now generated as `ungewoehnlich`; `es` still barred |
| P3 `spät`, `lange`, `länger` | Manner is correct | Unchanged — a time tag would have built `Ich stehe spät nicht auf` |
| P3 `kein-`, `zum Geburtstag`, `gern`, t3-17 | All correct | Unchanged |
| P3 `Der Zug ist wieder spät` | Sounds English | Rewritten as `Der Zug hat wieder Verspätung` |
| P2 instrument vs manner fronting | Instrument ordinary, manner marked | New `INSTR` role; `Mit dem Fahrrad fahre ich…` is `gueltig`, `schnell` stays `ungewoehnlich` |
| P3 `schon` / `wieder` fronting | Should not be offered | New `PARTIKEL` role, barred from the Vorfeld. t1-16 regrown so it keeps an alternative |
| t3-12 had no alternatives | Alternatives exist | Now generates `Ihm hat sie nicht geantwortet` as `ungewoehnlich`. **No sentence in the bank has a single solution any more** |

Accepted orders went from 347 to 404 — most of that is German the app would
previously have called wrong.

---

### 1.3 in detail

**Ruled: accept, possibly as canonical.** *Gestern hat mir der Mann das Buch
gegeben* is at least as natural as the subject-first order, and it is the same
pronoun-before-noun rule already enforced in 1.7.

**Implemented.** Pronoun subjects now carry `PRON_NOM` rather than `SUBJ` — 89
chunks across the three tiers, plus 17 in the corpus fixture — so the generator
can tell the two apart. `licensedSwap` accepts an object pronoun ahead of a
full-noun subject as `gueltig`; two pronouns are untouched, and nominative
still comes first there.

Adding `PRON_NOM` to `VORFELD_ELIGIBLE` was part of the same change. The role
had sat unused since it was defined, so nobody had noticed that the most
ordinary German sentence shape of all — a pronoun subject in the Vorfeld —
was not licensed by the set.

The bank exercises the rule in exactly one sentence (t3-05, and there only
under a marked fronting), so the gate on it is the corpus entry `r13-01`
rather than the content. **Worth more sentences with a full-noun subject and a
pronoun object when tiers 2 and 3 are extended.**

---

## Implemented later, in detail

Everything the review ruled on is now in the generator. These two came after
the first pass because each needed a new role rather than a rule change.

### Instrument versus manner in the Vorfeld

**Ruled:** fronting an instrument (*mit dem Fahrrad*) is ordinary; fronting a
true manner adverb (*schnell*, *gern*, *spät*) stays marked.

**Implemented** as a role split. `INSTR` carries the instrumentals — the seven
`mit dem …` chunks in the bank, plus one in the fixture — and fronts as
`gueltig`; `MODAL` keeps true manner and stays `ungewoehnlich` when fronted.
In the Mittelfeld `INSTR` ranks 61, immediately behind manner. No sentence in
the bank carries both, so that ordering is a considered guess rather than
something the corpus tests; it exists so the two never tie.

The corpus expectation for t3-04 was stale and moved `u` → `g`.

### `schon` and `wieder` in the Vorfeld

**Ruled:** their Mittelfeld placement is right, but *Schon schläft das Kind*
should not be offered as ordinary.

**Implemented** as the `PARTIKEL` role: ranks 42, with the temporals, and is
deliberately absent from `VORFELD_ELIGIBLE`, so the fronted order is not
produced at any class. Corpus entry `part-01` rejects it.

One knock-on: t1-16 was *Das Kind schläft schon* — three tiles, and with
`schon` unfrontable it became the only sentence in the bank with a single
solution. Rewritten as *Das Kind schläft um acht Uhr schon*, which gives it a
real alternative without changing what it teaches.

A particle *phrase* is a different constituent — *Schon wieder hat der Zug
Verspätung* is fine — and would be authored as one tile with its own role.

### Two traps to respect when authoring

- **Demonstrative `das` is not a personal pronoun.** *Ich gebe dir das morgen*
  is normal. No current sentence uses it; do not tag one as `PRON_AKK`.
- **Enclitic `'s`** (*Ich geb dir's morgen*) is everyday spoken German. The
  tiles spell `es`, so marking `dir es` wrong is fair — but the explanation
  could mention it.

### Role naming

`DIR` covers both direction and origin, and the reviewer confirmed *aus
Spanien* behaves identically to a destination. Worth renaming to
`DIR` = direction/origin in the role documentation.

---

## Verification status

**The 130 sentences that existed at review time are marked `verified: true`**
(2026-09-22), on the strength of the native-speaker review recorded in this
file: t1-01–t1-80, t2-01–t2-26, t3-01–t3-24.

**The 186 sentences added afterwards are `verified: false`** (2026-09-23):
t1-81–t1-120, t2-27–t2-120, t3-25–t3-76. They were drafted under the reviewed
rules, but no German speaker has seen them. They are playable, and
`npm run content:expand` prints the draft warning until they are checked.
Flip each one only after a German speaker has read it.

What that review actually covered, so the record is honest:

- Every **rule** the generator applies — Mittelfeld ranking, Vorfeld
  markedness, the pronoun and negation rules, the stress principle. This was
  read closely and several rulings overturned what the generator was doing.
- The sentences it quoted directly, and the corpus fixture.

The reviewer did **not** read the sentences one at a time. The flag records
the owner's judgement that the rules are now right and the bank was drafted
under them — not a line-by-line reading. Every ruling in the review is now implemented, including the two that were
open when the flag was first set, so nothing is pending that would change a
sentence's accepted set.

Re-verify per sentence if a new rule lands that moves orders between classes.

**2026-09-23 — `es` fix.** The ruling that `es` cannot carry stress was only
half implemented: it was kept out of the Vorfeld, but the Mittelfeld swap still
let it trail an adverbial (`Ich gebe morgen dir es`, as `ungewoehnlich`). That
is now barred, and a bank test checks it. t3-06, t3-07 and t3-08 (verified) and
t3-30–t3-33 each lose two accepted orders. This removes orders the review had
already ruled out, so their flags stand.

