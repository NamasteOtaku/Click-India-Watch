# Architecture

This project is intentionally minimal:

- `scripts/` — Scrapers and checkers that write daily snapshots to `data/status/`.
- `data/` — Channel list and daily JSON status files (one per day) used by frontend.
- `site/` — Static frontend that reads JSON data and displays channels.

Design goals:
- Simple, auditable snapshots
- Easy to run locally and schedule via CI
- Respectful of platforms' terms of service — use official APIs when required
