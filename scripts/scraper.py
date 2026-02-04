"""Simple scraper to gather channels and save an initial status snapshot.

This is intentionally lightweight — adapt to your needs and APIs.
"""
import json
import requests
from scripts.utils import load_json, save_json, read_lines, today_filename


def gather_channels():
    # For initial implementation, read channels.json
    ch = load_json('data/channels.json') or []
    return ch


def create_snapshot():
    channels = gather_channels()
    snapshot = {
        'date': __import__('datetime').date.today().isoformat(),
        'channels': []
    }

    for c in channels:
        snapshot['channels'].append({
            'id': c.get('id'),
            'name': c.get('name'),
            'url': c.get('url'),
            'meta': c.get('meta', {}),
            'online': False,
            'checked': None
        })

    save_json(snapshot, today_filename())
    print('Snapshot saved to', today_filename())


if __name__ == '__main__':
    create_snapshot()
