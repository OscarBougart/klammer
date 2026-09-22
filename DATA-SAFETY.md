# Data Safety — the evidence

Klammer declares **no data collected** in the Play Console. design.md §9 is
explicit that this is not merely a nice property but the reason several
features were cut: every analytics SDK, crash reporter with PII, ad network or
network call turns that declaration false and triggers re-review.

This file records how that claim was checked, so the next person can re-check
it rather than take it on faith. Re-run it before every release — E9.2.

**Last audited:** at 130 sentences, tiers 1–3 drafted.

---

## What was checked

### 1. The app makes no network calls

```
grep -rnE "\bfetch\(|XMLHttpRequest|WebSocket|axios|navigator\.sendBeacon" app/ src/ scripts/
```

**Result:** no matches. The app has no code path that opens a connection.

### 2. No data-collecting package is installed

Checked for the usual suspects — analytics, crash reporting, device
fingerprinting, tracking, and anything that requests a sensitive permission:

`expo-updates`, `@sentry/react-native`, `@react-native-firebase/*`,
`react-native-device-info`, `expo-tracking-transparency`, Amplitude, PostHog,
Mixpanel, Segment, `expo-notifications`, `expo-location`, `expo-contacts`,
`expo-media-library`.

**Result:** none present.

Note `expo-updates` in particular: over-the-air updates would mean the app
contacts a server on launch. Klammer does not use it, and adding it later would
change the declaration.

### 3. No Android permissions are requested

`app.json` declares `"permissions": []`.

**Result:** empty, as intended. The only permission design.md contemplates is
an optional local notification for the daily reminder, which is off by default
and declinable forever. That is not yet wired — when it is, it will need a
Data Safety re-check even though local notifications collect nothing.

### 4. All storage is on-device

- `expo-sqlite` — attempts, progress, review queue. Local file, never synced.
- `AsyncStorage` — five settings toggles. Local.

Nothing leaves the device, so there is no transfer to declare.

---

## Something that was found and removed

**`expo-drizzle-studio-plugin`** was listed as a *runtime* dependency.

It is an Expo DevTools plugin whose purpose is to expose the SQLite database to
an external inspector. Nothing in the app imported it — it had been added
speculatively — but a package that exists to surface the database over a debug
channel has no business in a production dependency tree for an app claiming to
collect nothing.

Removed. If Drizzle Studio is wanted for development, add it as a
**devDependency** so it cannot reach a release build.

This is the shape of failure to watch for: not a deliberate tracker, but a
convenience added during development that nobody remembers is there.

---

## Before each release

1. Re-run the grep in §1 over `app/` and `src/`.
2. Re-run the package check in §2 — a transitive dependency can introduce one.
3. Confirm `app.json` still declares `"permissions": []`.
4. Confirm no `expo-updates` and no OTA configuration.
5. If the daily reminder has shipped, confirm it is local-only and still off by
   default.

If any check fails, the Data Safety form must change before submitting —
design.md is blunt that getting this wrong means re-review.
