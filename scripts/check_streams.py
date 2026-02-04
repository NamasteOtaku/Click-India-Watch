import sys
import asyncio
import json
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Optional

import aiohttp

script_dir = Path(__file__).parent
project_root = script_dir.parent
sys.path.insert(0, str(project_root))

from utils import (
    get_project_root,
    load_json,
    save_json,
    get_daily_status_file,
    classify_stream,
    update_health_score,
)

USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'


async def check_stream(session: aiohttp.ClientSession, channel: Dict) -> Dict:
    url = channel.get('stream_url')
    start_time = time.time()
    head_success = False
    get_success = False
    http_code = 0
    content_type = ''
    bytes_read = 0
    
    try:
        async with session.head(url, timeout=aiohttp.ClientTimeout(total=6), allow_redirects=True) as resp:
            http_code = resp.status
            content_type = resp.headers.get('Content-Type', '')
            head_success = resp.status < 400
    except Exception:
        head_success = False
    
    if not head_success or http_code >= 400:
        try:
            headers = {'Range': 'bytes=0-32767'}
            async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=8), allow_redirects=True) as resp:
                http_code = resp.status
                content_type = resp.headers.get('Content-Type', '')
                data = await resp.read()
                bytes_read = len(data)
                get_success = resp.status < 400
        except Exception:
            get_success = False
    
    resp_time_ms = (time.time() - start_time) * 1000
    
    status = classify_stream(http_code, resp_time_ms, content_type, head_success, get_success)
    
    result = {
        'id': channel.get('id'),
        'name': channel.get('name'),
        'stream_url': url,
        'status': status,
        'http_code': http_code if http_code else None,
        'content_type': content_type if content_type else None,
        'resp_time_ms': round(resp_time_ms, 2),
        'checked_at': datetime.now(timezone.utc).isoformat()
    }
    
    return result


async def check_streams_concurrent(channels: list, max_workers: int = 20) -> list:
    connector = aiohttp.TCPConnector(limit_per_host=5, limit=max_workers)
    timeout = aiohttp.ClientTimeout(total=15)
    results = []
    
    async with aiohttp.ClientSession(connector=connector, timeout=timeout, headers={'User-Agent': USER_AGENT}) as session:
        semaphore = asyncio.Semaphore(max_workers)
        
        async def bounded_check(ch):
            async with semaphore:
                try:
                    return await check_stream(session, ch)
                except Exception as e:
                    return {
                        'id': ch.get('id'),
                        'name': ch.get('name'),
                        'stream_url': ch.get('stream_url'),
                        'status': 'dead',
                        'http_code': None,
                        'content_type': None,
                        'resp_time_ms': None,
                        'checked_at': datetime.now(timezone.utc).isoformat(),
                        'error': str(e)
                    }
        
        tasks = [bounded_check(ch) for ch in channels]
        results = await asyncio.gather(*tasks)
    
    return results


def main():
    root = get_project_root()
    channels_file = root / 'data' / 'channels.json'
    
    if not channels_file.exists():
        print(f"Error: {channels_file} not found")
        sys.exit(1)
    
    channels = load_json(str(channels_file))
    if not channels:
        print("Error: No channels found")
        sys.exit(1)
    
    print(f"Checking {len(channels)} channels...")
    
    results = asyncio.run(check_streams_concurrent(channels))
    
    status_file = get_daily_status_file()
    save_json(results, str(status_file))
    
    print(f"\nStatus written to {status_file}")
    
    stats = {
        'total': len(results),
        'live': sum(1 for r in results if r['status'] == 'live'),
        'slow': sum(1 for r in results if r['status'] == 'slow'),
        'dead': sum(1 for r in results if r['status'] == 'dead'),
        'unstable': sum(1 for r in results if r['status'] == 'unstable')
    }
    
    print(f"\nSummary:")
    print(f"  Total: {stats['total']}")
    print(f"  Live: {stats['live']}")
    print(f"  Slow: {stats['slow']}")
    print(f"  Dead: {stats['dead']}")
    print(f"  Unstable: {stats['unstable']}")
    
    channels_by_id = {ch['id']: ch for ch in channels}
    for result in results:
        ch = channels_by_id.get(result['id'])
        if ch:
            update_health_score(ch, result['status'])
    
    updated_channels = sorted(channels, key=lambda x: x['name'].lower())
    with open(channels_file, 'w', encoding='utf-8') as f:
        json.dump(updated_channels, f, indent=2, ensure_ascii=False)
    
    print(f"Updated {channels_file}")
    sys.exit(0)


if __name__ == '__main__':
    main()