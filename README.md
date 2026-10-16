# Sycamore Raffle Draw

A static HTML/CSS/JS build of the Sycamore Raffle Draw platform. It follows the Figma file
[Sycamore Raffle Draw — Product Design](https://www.figma.com/design/i0j8MXvAfEvcUUfyY74bSO) and the SISL brief.

## Pages

| Page | What it does |
| --- | --- |
| `index.html` | Admin console: sign in, MFA, overview, CSV upload, rules and duplicates, review and lock, control room, entrant pools, audit log, settings |
| `stage.html` | Live stage (viewer, read-only). Tickertape, 6.0 s braking, lock in the centre frame, winner reveal with confetti and the SHA-256 message |
| `verify.html` | Public verify portal. Recomputes the pool hash and every winning index in the browser |

## How a draw works

1. **Upload.** Drop a CSV (UTF-8, UTF-8-BOM or ISO-8859-1; comma, semicolon or tab). A `Name` or `Full Name` column is required; `Email` and an identifier column are optional. You can use `assets/sample/entrants_aug26.csv` (12,517 rows) to try it.
2. **Rules.** Choose `UNIQUE_ENTRANT` or `WEIGHTED_SLOT`, then turn on the name-matching rules you want: NFKC, lowercase, punctuation strip, tidy spaces.
3. **Lock.** The ordered, redacted slot list is hashed with SHA-256, and a UUIDv4 Draw ID is created.
4. **Draw.** `crypto.getRandomValues` plus rejection sampling picks the slot. The tape brakes over 6.0 s along a cubic curve and lands exactly on that card.
5. **Verify.** Download `pool_<id>.json` and `metadata_<id>.json`, then run the snippet shown on the verify page, or upload both files there.

Before the first round, open the stage from the control room (**Open stage**) and move it to the projector screen. The two screens sync through `localStorage` events in the same browser. Shortcuts: <kbd>Space</kbd> draws (in the control room), <kbd>F</kbd> toggles full screen on the stage.

## Limits of this static build

- Sign-in and MFA are front-end only. Any email, password and 6-digit code works. Real authentication needs the SISL backend.
- Data stays in the browser that created it. Remote viewers on other devices need a realtime backend, such as WebSockets.
- DM Sans stands in for Satoshi/Arial. Logos are the official Brand Drive SVGs in `assets/brand`.

## Run locally

```sh
python3 -m http.server 8080
# open http://localhost:8080
```

There is no build step. Any static host works, including GitHub Pages.
