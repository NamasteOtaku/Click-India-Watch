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
            return response.text
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


def normalize_channel(channel: Dict, first_seen: str, last_seen: str) -> Dict:
    return {
        'id': generate_id(channel['stream_url']),
        'name': channel['name'],
        'language': 'unknown',
        'country': 'India',
        'logo': channel['logo'] if channel['logo'] else None,
        'group': channel['group'],
        'source_file': channel['source_file'],
        'stream_url': channel['stream_url'],
        'tags': [],
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
