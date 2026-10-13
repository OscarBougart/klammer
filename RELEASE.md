# Release — Play Console

Everything needed to fill in the Play Console, drafted and ready to paste.
Nothing here can be completed by anyone without account access, so it is
written to be copied rather than rewritten.

Covers **E9.1** (listing), **E9.3** (content rating) and **E9.4** (privacy
policy). E9.2 has its own file, `DATA-SAFETY.md`. E9.5 (closed testing) and
E9.7 (staged rollout) are actions, not text.

---

## E9.1 — Store listing

### App name (max 30 characters)

```
Klammer: German Word Order
```

26 characters. The bare word `Klammer` means nothing to someone browsing in
English, and the store search that matters is "german word order".

### Short description (max 80 characters)

```
Put German sentences in the right order. Every correct order, not just one.
```

75 characters. The second sentence is the differentiator and belongs here
rather than buried in the long copy.

### Full description (max 4000 characters)

```
Word order is the mistake that survives longest.

You can reach B2 vocabulary and still write "Gestern ich habe ein neues
Fahrrad gekauft" — every word correct, the verb in the wrong place. Most
grammar apps drill cases and conjugation, because those are easy to mark.
Almost nobody drills position.

The reason is that position is hard to mark. German usually allows several
correct orders, and most apps dodge this by accepting exactly one. Klammer
accepts all of them, and tells you what changes when you choose a different
one.

HOW IT WORKS

A sentence arrives as a handful of word tiles. Tap them in the order you
think is right, or drag one to where it belongs. Nothing stops you building
a wrong sentence — being wrong has to be possible, or nothing is being
tested.

Press Prüfen and your sentence is laid out in the fields German grammar
actually uses: the Vorfeld, the two halves of the Satzklammer, the
Mittelfeld, the Nachfeld. Seeing your own sentence split that way makes the
bracket obvious in a way a textbook diagram does not.

THREE WAYS TO BE RIGHT

Most apps have two answers: right and wrong. German needs more.

• Richtig — the neutral order
• Auch richtig — fully grammatical, different emphasis
• Möglich, aber ungewöhnlich — grammatical, but you would rarely say it

"Morgen fahre ich nach Berlin" and "Ich fahre morgen nach Berlin" are both
right. Being told what the difference is is worth more than a red cross.
When you are wrong, Klammer names the rule you broke and lets you try again
or see the answer.

FIVE STUFEN

1. Position zwei — the finite verb is always second
2. Die Klammer — separable verbs, the perfect tense, modal verbs
3. Das Mittelfeld — time, manner, place, pronouns, negation
4. Der Nebensatz — the verb goes last
5. Das Nachfeld — what may come after the bracket

Start at the beginning, or try any Stufe whenever you like. Three good
rounds in a row move you up.

SHORT ON PURPOSE

A round is five sentences, about five minutes. There is no timer while you
are solving, because time pressure degrades exactly the kind of thinking
this app trains.

WHAT THIS APP DOES NOT DO

No accounts. No adverts. No in-app purchases. No streaks, leaderboards,
hearts, XP, gems or mascots. No notifications.

It collects nothing. There is no network connection at all — everything
stays on your phone, which is also why it works on a plane.

BUILT FOR READING

Dark by default, with a light theme in Settings. Set in Atkinson
Hyperlegible, a typeface designed for letterform clarity — which is what
you want when reading a language you do not own yet. English translations
can be switched off once you no longer need them. Screen-reader labels
throughout, text that scales to 200%, and every animation respects your
reduced-motion setting.

Vocabulary stays inside the Goethe A1–B1 range, so word order is the only
difficulty.
```

### Category and tags

- **Category:** Education
- **Tags:** Language learning, German, Grammar
- **Content rating:** see E9.3 below
- **Contains ads:** No
- **In-app purchases:** No

### Graphics — E7.3

| Asset | Size | Status |
|---|---|---|
| App icon | 512 × 512 | **Done:** `assets/images/play-store-icon.png`, from `npm run icons` |
| Feature graphic | 1024 × 500 | `assets/store/feature-graphic.png`, from `npm run icons` |
| Phone screenshots | ≥ 2, up to 8 | Taken from a real build — see below |

**Screenshot plan** — each should show the product doing its job, not a
marketing slogan:

1. Home: the sample sentence with its bracket, the five Stufen
2. A Stufe-2 sentence half built in the row, words left in the bank
3. The same sentence after Prüfen: split into fields, the bracket closed
4. The **Auch richtig** verdict — this is the differentiator, and no
   competitor screenshot looks like it
5. A wrong answer with the rule named, Nochmal / Lösung zeigen
6. The result screen, wrong answers first

---

## E9.3 — Content rating questionnaire

Google uses the IARC questionnaire. Expected answers, all of which follow from
the app actually doing nothing:

| Question | Answer |
|---|---|
| Category | Reference, News, or Educational |
| Violence | None |
| Sexuality | None |
| Language (profanity) | None |
| Controlled substances | None |
| Gambling or simulated gambling | None |
| User-generated content | None |
| Users can interact | No |
| Shares user location | No |
| Allows purchases | No |
| Shares personal information | No |
| Digital purchases | No |

Expected outcome: **PEGI 3 / ESRB Everyone**.

⚠️ Two answers depend on content nobody has verified yet: the questionnaire
asks about crude humour and references to substances. The sentence bank
mentions coffee, tea, milk and wine-free everyday life; it contains nothing
that would change the rating. Confirm after the native-speaker pass, since the
bank may change.

---

## E9.4 — Privacy policy

design.md plans to use Termly, as with Dram. Whatever generator is used, the
policy must state the following, and every line of it is currently true —
`DATA-SAFETY.md` is the evidence.

**Required statements:**

1. The app collects no personal data.
2. The app transmits no data. There is no network connection.
3. All data — progress, attempts, settings — is stored only on the device.
4. Uninstalling the app deletes all of it. There is no backup and no account.
5. No third-party SDK, analytics, crash reporter or advertising network.
6. No permissions are requested.
7. Contact address for questions.
8. Children: the app collects nothing from anyone, of any age.

**Draft text**, if writing it by hand is preferred to a generator:

```
Klammer does not collect, transmit or store any personal data.

The app has no network connection. It does not contact any server, and it
contains no analytics, advertising, crash-reporting or tracking software of
any kind.

Everything the app remembers — which sentences you have answered, your
progress through the levels, and your settings — is stored only on your own
device. It is never uploaded anywhere. Deleting the app deletes all
of it permanently; there is no account and no backup.

The app requests no permissions.

Because the app collects nothing from anyone, it collects nothing from
children.

If you have questions about this policy, contact: <ADDRESS>
```

The policy needs a public URL before submission — Play requires it in the
listing and in the Data Safety form.

---

## E9.5 — Closed testing

epics.md asks for 12+ testers over 14 days, to answer one question: **does the
mechanic hold attention for a fortnight?**

Prerequisites, in order:

1. A German speaker has verified the bank — done for the first 130
   sentences, **open for the other 392** (all of tiers 4 and 5 included).
   `npm run content:expand` counts what's left; see the verification-status
   note in `GERMAN-REVIEW.md`, which also lists the open questions for the
   reviewer. **This is the long pole.**
2. A real device build succeeds — E0.5, still open.
3. ~~Content reaches roughly 370 sentences across tiers 1–3~~ — done: 522
   across tiers 1–5.
4. ~~Icon~~ (done) and feature graphic exist; screenshots from the first
   real build — E7.3.
5. Privacy policy has a public URL — `docs/privacy.html`, served by GitHub
   Pages.
6. ~~12 testers~~ — ready.

**What to measure**, per epics.md E9.6:

- sessions-to-exhaustion — how many sessions before a tester runs out of new
  sentences. This decides whether v1.1 needs a second content pack.
- Whether testers reach tier 3 through normal play.
- Every order the expander rejected that a tester believed was correct. This
  is the highest-value signal in the whole test, because it is the failure the
  risk table calls nearly fatal, and a closed test is the only place it will
  surface before release.

That last one needs logging that does not exist yet, and cannot use the
network. A local log the tester can export by hand would preserve the Data
Safety claim; anything that phones home would not.
