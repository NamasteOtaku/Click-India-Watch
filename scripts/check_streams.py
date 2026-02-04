"""Check channels for live/online status and write to daily status file."""
import requests
from datetime import datetime
from scripts.utils import load_json, save_json, today_filename


def check_channel(channel):
    url = channel.get('url')
    try:
        r = requests.head(url, timeout=5)
        online = r.status_code == 200
    except Exception:
        online = False
    return online


def main():
    channels = load_json('data/channels.json') or []
    result = {
        'date': datetime.utcnow().isoformat(),
        'channels': []
    }

    for c in channels:
        online = check_channel(c)
        result['channels'].append({
            'id': c.get('id'),
            'name': c.get('name'),
            'url': c.get('url'),
            'online': online,
            'checked_at': datetime.utcnow().isoformat(),
        })

    save_json(result, today_filename())
    print('Status written to', today_filename())


if __name__ == '__main__':
    main()
