# scripts/utils.py
import hashlib
import json
import re
import requests
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple


def get_project_root() -> Path:
    return Path(__file__).resolve().parent.parent


def load_sources() -> List[str]:
    sources_file = get_project_root() / "data" / "sources.txt"
    sources = []
    if sources_file.exists():
        with open(sources_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    sources.append(line)
    return sources


def fetch_playlist(url: str, max_retries: int = 3, timeout: int = 15) -> Optional[str]:
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    for attempt in range(max_retries):
        try:
            response = requests.get(url, headers=headers, timeout=timeout, allow_redirects=True)
            response.raise_for_status()
            
            content_type = response.headers.get('Content-Type', '').lower()
            if not any(x in content_type for x in ['mpegurl', 'm3u', 'text']):
                print(f"Warning: Unexpected Content-Type for {url}: {content_type}")
            
            text = response.text
            if '#EXTM3U' not in text[:2048]:
                print(f"Rejected non-M3U source: {url}")
                return None
            
            return text
        except Exception:
            if attempt < max_retries - 1:
                continue
            return None
    return None


def parse_extinf_line(line: str) -> Tuple[Dict[str, str], Optional[str]]:
    if not line.startswith('#EXTINF:'):
        return {}, None
    
    parts = line.split(',', 1)
    if len(parts) != 2:
        return {}, None
    
    header = parts[0]
    name = parts[1].strip()
    attrs = {}
    
    match = re.search(r'tvg-id="([^"]*)"', header)
    if match:
        attrs['tvg-id'] = match.group(1)
    
    match = re.search(r'tvg-name="([^"]*)"', header)
    if match:
        attrs['tvg-name'] = match.group(1)
    
    match = re.search(r'tvg-logo="([^"]*)"', header)
    if match:
        attrs['tvg-logo'] = match.group(1)
    
    match = re.search(r'group-title="([^"]*)"', header)
    if match:
        attrs['group-title'] = match.group(1)
    
    return attrs, name


def parse_playlist(content: str, source_url: str) -> List[Dict]:
    channels = []
    lines = content.split('\n')
    i = 0
    
    while i < len(lines):
        line = lines[i].strip()
        
        if line.startswith('#EXTINF:'):
            attrs, name = parse_extinf_line(line)
            
            i += 1
            while i < len(lines):
                stream_url = lines[i].strip()
                if stream_url and not stream_url.startswith('#'):
                    break
                i += 1
            
            if i >= len(lines) or not stream_url:
                continue
            
            if not (stream_url.startswith('http://') or stream_url.startswith('https://')):
                i += 1
                continue
            
            channel = {
                'name': name or 'Unknown',
                'stream_url': stream_url,
                'logo': attrs.get('tvg-logo', None),
                'group': attrs.get('group-title', None),
                'source_file': source_url,
                'attrs': attrs
            }
            channels.append(channel)
        
        i += 1
    
    return channels


def generate_id(stream_url: str) -> str:
    return hashlib.sha256(stream_url.encode('utf-8')).hexdigest()[:16]


def detect_language(name: str, group: str) -> str:
    """Detect language from channel name and group using keyword rules."""
    text = f"{name} {group}".lower()
    
    hindi_kw = ['zee', 'star', 'dd', 'bharat', 'aaj', 'india', 'news18']
    english_kw = ['tv', 'news', 'times', 'global', 'international']
    tamil_kw = ['sun', 'kalaignar', 'polimer', 'thanthi']
    telugu_kw = ['etv', 'gemini', 'sakshi']
    malayalam_kw = ['asianet', 'manorama', 'kairali']
    bengali_kw = ['bangla', 'zee bangla']
    punjabi_kw = ['ptc', 'chardikla']
    marathi_kw = ['abp maza', 'zee marathi']
    urdu_kw = ['hum', 'ary']
    
    if any(kw in text for kw in hindi_kw):
        return 'Hindi'
    if any(kw in text for kw in english_kw):
        return 'English'
    if any(kw in text for kw in tamil_kw):
        return 'Tamil'
    if any(kw in text for kw in telugu_kw):
        return 'Telugu'
    if any(kw in text for kw in malayalam_kw):
        return 'Malayalam'
    if any(kw in text for kw in bengali_kw):
        return 'Bengali'
    if any(kw in text for kw in punjabi_kw):
        return 'Punjabi'
    if any(kw in text for kw in marathi_kw):
        return 'Marathi'
    if any(kw in text for kw in urdu_kw):
        return 'Urdu'
    
    return 'Unknown'


def normalize_category(name: str, group: str) -> str:
    """Normalize category from group or name."""
    text = f"{name} {group}".lower()
    
    news_kw = ['news', 'samachar', 'tv9', 'ndtv']
    sports_kw = ['sports', 'cricket', 'ten sports']
    kids_kw = ['kids', 'cartoon', 'shinchan', 'pogo']
    movies_kw = ['movies', 'cinema', 'film']
    religious_kw = ['bhajan', 'aastha', 'sanskar', 'islam', 'quran']
    music_kw = ['music', 'mtv', '9xm']
    
    if any(kw in text for kw in news_kw):
        return 'News'
    if any(kw in text for kw in sports_kw):
        return 'Sports'
    if any(kw in text for kw in kids_kw):
        return 'Kids'
    if any(kw in text for kw in movies_kw):
        return 'Movies'
    if any(kw in text for kw in religious_kw):
        return 'Religious'
    if any(kw in text for kw in music_kw):
        return 'Music'
    
    return 'Entertainment'


def normalize_channel(channel: Dict, first_seen: str, last_seen: str) -> Dict:
    name = channel['name']
    group = channel['group'] or ''
    
    return {
        'id': generate_id(channel['stream_url']),
        'name': name,
        'language': detect_language(name, group),
        'country': 'India',
        'logo': channel['logo'] if channel['logo'] else None,
        'group': group,
        'category': normalize_category(name, group),
        'source_file': channel['source_file'],
        'stream_url': channel['stream_url'],
        'tags': [],
        'browser_playable': True,
        'first_seen': first_seen,
        'last_seen': last_seen,
        'health_score': 1.0
    }


def deduplicate_channels(channels: List[Dict]) -> List[Dict]:
    seen = set()
    unique = []
    for ch in channels:
        url = ch['stream_url']
        if url not in seen:
            seen.add(url)
            unique.append(ch)
    return unique


def save_channels_json(channels: List[Dict], output_file: str):
    sorted_channels = sorted(channels, key=lambda x: x['name'].lower())
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(sorted_channels, f, indent=2, ensure_ascii=False)


def load_json(path: str) -> Optional[List[Dict]]:
    path_obj = Path(path)
    if not path_obj.exists():
        return None
    with open(path_obj, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_json(obj: List[Dict], path: str):
    path_obj = Path(path)
    path_obj.parent.mkdir(parents=True, exist_ok=True)
    with open(path_obj, 'w', encoding='utf-8') as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)


def get_daily_status_file() -> Path:
    from datetime import date
    status_dir = get_project_root() / "data" / "status"
    status_dir.mkdir(parents=True, exist_ok=True)
    return status_dir / f"{date.today().isoformat()}.json"


def classify_stream(http_code: int, resp_time_ms: float, content_type: str, head_success: bool, get_success: bool) -> str:
    if http_code >= 400 or not head_success:
        return "dead"
    
    if head_success and not get_success:
        return "unstable"
    
    if not content_type or not any(x in content_type.lower() for x in ['mpeg', 'video', 'm3u', 'stream', 'octet']):
        if get_success:
            return "unstable"
        return "dead"
    
    if resp_time_ms >= 3000:
        return "slow"
    
    return "live"


def update_health_score(channel: Dict, status: str) -> Dict:
    score = channel.get('health_score', 1.0)
    
    if status == 'live':
        score = min(score + 0.01, 1.0)
    elif status == 'slow':
        score = min(score + 0.005, 1.0)
    elif status == 'unstable':
        score = max(score - 0.02, 0.0)
    elif status == 'dead':
        score = max(score - 0.05, 0.0)
    
    channel['health_score'] = score
    
    if status in ['live', 'slow']:
        channel['last_seen'] = datetime.now(timezone.utc).isoformat()
    
    return channel