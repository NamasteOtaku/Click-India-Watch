import sys
from datetime import datetime, timezone
from pathlib import Path

script_dir = Path(__file__).parent
project_root = script_dir.parent
sys.path.insert(0, str(project_root))

from utils import (
    get_project_root,
    load_sources,
    fetch_playlist,
    parse_playlist,
    normalize_channel,
    deduplicate_channels,
    save_channels_json,
)


def main():
    root = get_project_root()
    sources = load_sources()
    
    if not sources:
        print("Error: No sources found in data/sources.txt")
        sys.exit(1)
    
    now = datetime.now(timezone.utc).isoformat()
    all_channels = []
    success_count = 0
    
    print(f"Scraping {len(sources)} source(s)...")
    
    for source_url in sources:
        print(f"  Fetching {source_url}...", end='', flush=True)
        content = fetch_playlist(source_url)
        
        if content is None:
            print(" FAILED")
            continue
        
        print(" OK")
        
        channels = parse_playlist(content, source_url)
        print(f"    Parsed {len(channels)} channels")
        
        for ch in channels:
            normalized = normalize_channel(ch, now, now)
            all_channels.append(normalized)
        
        success_count += 1
    
    if success_count == 0:
        print("Error: All sources failed")
        sys.exit(1)
    
    print(f"\nTotal channels before dedup: {len(all_channels)}")
    all_channels = deduplicate_channels(all_channels)
    print(f"Total channels after dedup: {len(all_channels)}")
    
    output_file = root / "data" / "channels.json"
    save_channels_json(all_channels, str(output_file))
    print(f"Saved to {output_file}")
    sys.exit(0)


if __name__ == '__main__':
    main()