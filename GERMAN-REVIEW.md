# What a German speaker needs to check

Klammer decides what German is correct. That decision is currently made by a
generator I wrote and content I drafted, neither of which has been checked by
someone who speaks the language natively.

This file is the handover list. It is ordered by **what breaks if it is
wrong**, not by how interesting the question is.

> **How to use this:** most items are a pair of sentences with a question
> underneath. You do not need any grammar theory to answer them — "the first
> one, the second sounds odd" is exactly the right kind of answer.

**Status:** nothing below has been verified. `npm run content:expand` prints
the unverified count on every run.

---

## Priority 1 — rules that affect every sentence

These are baked into the generator (`src/content/mittelfeld.ts`). If one is
wrong, it is wrong across the whole bank, including sentences not yet written.

### 1.1 Where does a bare or indefinite object sit?

The generator puts it **late** — after time, reason and manner.

> a. Sie spricht **sehr gut Deutsch**.
> b. Sie spricht **Deutsch sehr gut**.

> a. Ich trinke **morgens Kaffee**.
> b. Ich trinke **Kaffee morgens**.

**Question:** is (a) clearly the normal one in both? Is (b) *wrong*, or just
unusual? This matters because the app currently calls (b) **wrong** in the
second pair, and being told correct German is wrong is the failure mode the
project most wants to avoid.

### 1.2 Where does a definite object sit relative to a time phrase?

The generator puts a **definite** object **before** the time phrase, and an
**indefinite** one after.

> a. Ich hole **meine Schwester morgen** vom Bahnhof ab.
> b. Ich hole **morgen meine Schwester** vom Bahnhof ab.

**Question:** which is the more neutral? Both are currently accepted — the
question is only which one the app should call "the normal way to say it".

### 1.3 Does the subject come before object pronouns?

The generator always puts the subject first. That is certainly right when the
subject is itself a pronoun (`dass sie mich morgen abholen muss`), but it has
never been checked with a full noun subject:

> a. Gestern hat **der Mann mir** das Buch gegeben.
> b. Gestern hat **mir der Mann** das Buch gegeben.

**Question:** is (b) at least as natural as (a)? The generator currently does
not produce (b) at all. **This is a known gap**, flagged in the code.

### 1.4 When may an object pronoun sit behind a time phrase?

The generator **refuses** this entirely, because the evidence was one good
sentence against one bad one:

> good: …dass sie **morgen mich** vom Bahnhof abholen muss.
> bad:  Er hat **gestern mir** erzählt, dass…

**Question:** what is the actual difference? Is it that `mich` (accusative)
can and `mir` (dative) cannot? Or that it is allowed in a subordinate clause
but not a main one? Or is the first one also poor?

### 1.5 Negation and place

design.md says negation goes before predicatives and directionals. It says
nothing about ordinary place phrases, and the generator currently puts place
**before** negation — which produces:

> Wir sind am Wochenende **zu Hause nicht**. ← what the generator would build
> Wir sind am Wochenende **nicht zu Hause**. ← what people say

**Question:** confirm the second is right. I have avoided writing any sentence
with negation plus a place phrase until this is settled, so nothing currently
ships with it — but tier 3 will need it.

### 1.6 Does `es` really lead, even before the dative?

Tier 3 turns on an inversion: two full nouns run dative-then-accusative, but
two pronouns run accusative-then-dative.

> a. Ich gebe **es dir** morgen.
> b. Ich gebe **dir es** morgen.

**Question:** is (a) clearly right and (b) clearly wrong? The whole of tier 3
rests on this, and the app currently marks (b) as an error and names the rule.

### 1.7 A pronoun object plus a full noun object

> a. Er hat **mir das Buch** noch nicht zurückgegeben.
> b. Er hat **das Buch mir** noch nicht zurückgegeben.

**Question:** the app accepts (a) and rejects (b). Correct?

---

## Priority 2 — what the app calls "normal" versus "unusual"

The app has three ways of being right: **kanonisch** (the neutral order),
**auch richtig** (fine, different emphasis), and **möglich, aber ungewöhnlich**
(grammatical but you would rarely say it). Getting these wrong does not teach
bad German, but it does mislead.

Currently:

| Putting this first | App says |
|---|---|
| the subject | normal |
| a time phrase (*morgen*) | also correct |
| a reason (*wegen der Prüfung*) | also correct |
| a **definite** object (*das Buch*) | also correct |
| a place (*in Aachen*) | unusual |
| a direction (*vom Bahnhof*) | unusual |
| a manner phrase (*mit dem Fahrrad*) | unusual |
| an **indefinite** object (*ein Buch*) | unusual |

**Question:** do the "unusual" ones deserve that label? For example:

> **Vom Bahnhof** hole ich meine Schwester morgen ab.
> **Mit dem Fahrrad** fährt sie jeden Tag zur Arbeit.

Are these genuinely marked — things you would say only to answer a specific
question — or are they ordinary?

---

## Priority 3 — individual role tags I was unsure about

Each chunk carries a grammatical role that decides where it can go. These are
the ones where I guessed.

| Sentence | Chunk | Tagged as | Doubt |
|---|---|---|---|
| t1-16 | *schon* (Das Kind schläft schon) | time | It is an aspect particle, not really a time phrase |
| t1-76 | *wieder* (Der Zug ist wieder spät) | time | Same |
| t1-48 | *aus Spanien* (Sie kommt aus Spanien) | direction | It is an origin, not a destination — same role covers both |
| t2-04 | *spät* (Ich stehe spät auf) | manner | Arguably duration/time |
| t2-15 | *lange* (Sie hat lange gearbeitet) | manner | Arguably duration/time |
| t2-21 | *länger* (Ich darf länger bleiben) | manner | Same |
| t1-40, t1-41 | *keinen Kaffee*, *keine Zeit* | indefinite object | Treated as an object rather than negation, since *kein* is a determiner. Correct? |
| corpus t3-01 | *zum Geburtstag* | reason | Originally tagged as time; changed because it is an occasion. Right call? |
| t3-18 | *gern* (Wir fahren im Winter gern in die Berge) | manner | It is closer to an attitude than a manner; does it sit in the right place? |
| t3-17 | *zu Hause* with *wegen der Kinder* | place + reason | Is *Sie arbeitet seit Januar wegen der Kinder zu Hause* natural, or overloaded? |

---

## Priority 4 — every canonical order

The app shows one order per sentence as **the** neutral way to say it. That
claim is only as good as my ear.

`npm run content:review` walks through every sentence and its accepted
alternatives, one at a time, so they can be kept or vetoed. Decisions are
written straight back into the YAML.

The fastest useful pass: read only the **kanonisch** line of each sentence and
flag any that sound off. There are 130.

---

## Sentences with only one accepted order

A handful of sentences admit no alternative at all, so the learner has exactly
one way to be right:

- **t3-12** *Sie hat ihm nicht geantwortet.*

**Question:** is there genuinely no other order here? If an alternative exists
and the generator does not produce it, the learner will be told correct German
is wrong — the failure this project cares most about.

---

## Errors already found and fixed

Listed so they can be spot-checked rather than taken on trust — and because
the pattern of mistake matters more than the individual mistakes.

| What | Where | Fix |
|---|---|---|
| Bare object ranked before manner, giving *Sie spricht Deutsch sehr gut* | generator | Indefinite objects moved after adverbials |
| *morgen früh* split into two tiles | t2-20 | One constituent, one tile |
| *um acht Uhr* tagged as manner to dodge a second time slot | t2-07 | Sentence rewritten; role tags must describe, not accommodate |
| Definite object + time ordered inconsistently between sentences | tier 1 | That pairing removed from tier 1 entirely; it belongs to tier 3 |
| Generator dropped a whole clause from some orders | generator | Now throws rather than emitting a short order |
| English gloss said "I" where the German said *Wir* | t3-11 | Gloss corrected; all 130 now cross-checked automatically |

Three of those five were **me bending the content to fit the machinery**
rather than writing the sentence properly. That is the failure mode to watch
for when reading the bank.

---

## The one-line version

If you only have twenty minutes: **answer Priority 1.** Those five questions
decide what the app teaches about every sentence, including the ones not
written yet. Everything else can be corrected sentence by sentence later.
