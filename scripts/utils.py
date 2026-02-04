"""Utility helpers for data I/O and filenames."""
import json
from pathlib import Path
from datetime import date

ROOT = Path(__file__).resolve().parents[0].parent
DATA_DIR = ROOT / "data"
STATUS_DIR = DATA_DIR / "status"
STATUS_DIR.mkdir(parents=True, exist_ok=True)


def load_json(path):
    path = Path(path)
    if not path.exists():
        return None
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


def save_json(obj, path):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(obj, fh, ensure_ascii=False, indent=2)


def read_lines(path):
    path = Path(path)
    if not path.exists():
        return []
    with open(path, "r", encoding="utf-8") as fh:
        return [l.strip() for l in fh if l.strip()]


def today_filename():
    return STATUS_DIR / f"{date.today().isoformat()}.json"
