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
| 1.4 / 1.7 pronoun out of slot | Marked, not wrong | Generator now produces them as `ungewoehnlich` with a stress note, instead of refusing |
| 1.5 negation and place | Confirmed | `NEG` rank moved 80 → 55, now before manner, place, direction and predicatives. It had been building `zu Hause nicht` |
| 1.6 two pronouns | `es dir` right, `dir es` wrong | Tier 3 stands unchanged |
| 1.6 two full objects | Accusative-first is emphasis, not error | `Ich gebe das Buch meinem Bruder` now generated as `gueltig` |
| P2 place fronting | Ordinary | `In Aachen wohne ich…` moved from `ungewoehnlich` to `gueltig` |
| P2 fronted object pronoun | Only under contrast | `Mir hat er…` now generated as `ungewoehnlich`; `es` still barred |
| P3 `spät`, `lange`, `länger` | Manner is correct | Unchanged — a time tag would have built `Ich stehe spät nicht auf` |
| P3 `kein-`, `zum Geburtstag`, `gern`, t3-17 | All correct | Unchanged |
| P3 `Der Zug ist wieder spät` | Sounds English | Rewritten as `Der Zug hat wieder Verspätung` |
| t3-12 had no alternatives | Alternatives exist | Now generates `Ihm hat sie nicht geantwortet` as `ungewoehnlich`. **No sentence in the bank has a single solution any more** |

Accepted orders went from 347 to 405 — most of that is German the app would
previously have called wrong.

---

## Still open

### 1.3 — object pronoun before a full-noun subject

**Ruled: accept, possibly as canonical.** *Gestern hat mir der Mann das Buch
gegeben* is at least as natural as the subject-first order, and it is the same
pronoun-before-noun rule already enforced in 1.7.

**Not implemented.** The generator cannot currently tell a pronoun subject
from a noun subject — all 130 sentences tag both as `SUBJ`, and the rule
applies only to noun subjects. Fixing it means either retagging pronoun
subjects as `PRON_NOM` (the role exists and is unused) or adding a flag.
Mechanical, but it touches every sentence, so it wants doing deliberately
rather than at the end of a long session.

Consequence meanwhile: the app does not *reject* these orders, it simply never
offers them as alternatives. Additive gap, not wrong German.

### Instrument versus manner in the Vorfeld

**Ruled:** fronting an instrument (*mit dem Fahrrad*) is ordinary; fronting a
true manner adverb (*schnell*, *gern*, *spät*) stays marked.

**Not implemented** — both currently carry the `MODAL` role, so they cannot be
told apart. Needs a role split. Fronted `MODAL` is currently `ungewoehnlich`,
which is right for manner and too harsh for instruments.

### `schon` and `wieder` in the Vorfeld

**Ruled:** their Mittelfeld placement is right, but *Schon schläft das Kind*
should not be offered as ordinary. Block them from the Vorfeld or give them
their own role. **Not implemented.**

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

## Still unverified

The **130 sentences themselves** have not been read one by one — the review
covered the rules, not the bank. `npm run content:expand` reports the
unverified count on every run, and it is still 130 of 130.

