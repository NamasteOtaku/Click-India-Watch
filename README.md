# Click India Watch ✅

Lightweight project to scrape and monitor public livestream channels and expose a simple site to browse current and past statuses.

## Structure

- `scripts/` — Python scrapers and helpers
- `data/` — sources, channel list, and daily status dumps
- `site/` — minimal React frontend
- `assets/` — logos and static assets
- `docs/` — architecture and takedown policy

## Quick start

1. Install Python dependencies: `pip install -r scripts/requirements.txt`
2. Run a daily check locally: `python3 scripts/check_streams.py`
3. Start the frontend: `cd site && npm install && npm start`

License: MIT — see `LICENSE` for details.