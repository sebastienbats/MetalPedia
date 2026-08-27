#!/usr/bin/env python3
import os, json, time, re, argparse, requests
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, List, Set
from tqdm import tqdm
from dotenv import load_dotenv

load_dotenv()

LASTFM_API_KEY = os.getenv('LASTFM_API_KEY')
LASTFM_API_URL = 'http://ws.audioscrobbler.com/2.0/'
DEFAULT_OUTPUT = '../data/metal_bands.json'
PROGRESS_FILE = '../data/fetch_progress.json'
RATE_LIMIT_DELAY = 0.25  # 4 req/sec pour respecter Last.fm

METAL_TAGS = [
    'heavy metal', 'thrash metal', 'death metal', 'black metal', 'power metal',
    'doom metal', 'progressive metal', 'folk metal', 'symphonic metal', 'gothic metal',
    'nu metal', 'metalcore', 'groove metal', 'industrial metal', 'speed metal',
    'melodic death metal', 'brutal death metal', 'technical death metal', 'viking metal',
    'pagan metal', 'sludge metal', 'stoner metal', 'post-metal', 'djent', 'grindcore',
    'deathcore', 'swedish death metal', 'finnish death metal', 'norwegian black metal',
    'symphonic black metal', 'epic metal'
]

class LastFmClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.session = requests.Session()
        self.request_count = 0
        
    def _request(self, params: Dict) -> Optional[Dict]:
        params['api_key'] = self.api_key
        params['format'] = 'json'
        for attempt in range(3):
            try:
                time.sleep(RATE_LIMIT_DELAY)
                response = self.session.get(LASTFM_API_URL, params=params, timeout=15)
                self.request_count += 1
                if response.status_code == 200: return response.json()
                elif response.status_code == 429:
                    print(f"\n⚠️ Rate limit, attente de 60s...")
                    time.sleep(60)
                else: return None
            except requests.RequestException:
                time.sleep(2)
        return None
    
    def get_top_artists(self, tag: str, limit: int = 100, page: int = 1) -> List[Dict]:
        data = self._request({'method': 'tag.gettopartists', 'tag': tag, 'limit': limit, 'page': page})
        artists = data.get('topartists', {}).get('artist', []) if data else []
        return artists if isinstance(artists, list) else []
    
    def get_artist_info(self, artist_name: str) -> Optional[Dict]:
        data = self._request({'method': 'artist.getinfo', 'artist': artist_name, 'autocorrect': 1})
        return data.get('artist') if data else None

def clean_biography(bio: str) -> str:
    if not bio: return ''
    clean = re.sub(r'<[^>]+>', '', bio)
    clean = re.sub(r'\s*Read more on Last\.fm.*$', '', clean, flags=re.IGNORECASE | re.DOTALL)
    return re.sub(r'\s+', ' ', clean).strip()[:2000]

def process_artist(artist_data: Dict, source_tag: str) -> Optional[Dict]:
    if not artist_data: return None
    name = artist_data.get('name', '').strip()
    if not name: return None
    
    tags = artist_data.get('tags', {}).get('tag', [])
    if not isinstance(tags, list): tags = []
    
    # Extraction du genre principal
    metal_genres = {'black metal', 'death metal', 'thrash metal', 'heavy metal', 'power metal', 
                    'doom metal', 'progressive metal', 'folk metal', 'symphonic metal', 'gothic metal', 
                    'nu metal', 'metalcore', 'groove metal', 'industrial metal', 'speed metal', 'grindcore', 
                    'deathcore', 'sludge metal', 'stoner metal', 'viking metal', 'pagan metal', 'post-metal', 'djent'}
    genre = 'Metal'
    for tag in tags:
        if tag.get('name', '').lower() in metal_genres:
            genre = tag.get('name', '').title()
            break

    images = artist_data.get('image', [])
    image_url = next((img['#text'] for img in reversed(images) if img.get('#text')), None)
    
    try: listeners = int(artist_data.get('stats', {}).get('listeners', 0) or 0)
    except: listeners = 0

    return {
        'name': name, 'genre': genre, 'country': 'Unknown', 'formed': None,
        'status': 'Active', 'biography': clean_biography(artist_data.get('bio', {}).get('content', '')),
        'image_url': image_url, 'listeners': listeners, 'source_tag': source_tag,
        'fetched_at': datetime.utcnow().isoformat()
    }

def load_progress(path: str) -> Dict:
    if not Path(path).exists(): return {'seen_names': [], 'bands': [], 'last_tag_idx': 0, 'last_page': 0}
    try:
        with open(path, 'r', encoding='utf-8') as f: return json.load(f)
    except: return {'seen_names': [], 'bands': [], 'last_tag_idx': 0, 'last_page': 0}

def save_progress(path: str, progress: Dict):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f: json.dump(progress, f, ensure_ascii=False)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--limit', type=int, default=10000)
    parser.add_argument('--output', type=str, default=DEFAULT_OUTPUT)
    parser.add_argument('--resume', action='store_true')
    parser.add_argument('--reset', action='store_true')
    args = parser.parse_args()

    if args.reset and Path(PROGRESS_FILE).exists():
        Path(PROGRESS_FILE).unlink()
        print("🗑️ Progression réinitialisée")
        return

    if not LASTFM_API_KEY:
        print("❌ LASTFM_API_KEY manquante dans .env")
        return

    client = LastFmClient(LASTFM_API_KEY)
    progress = load_progress(PROGRESS_FILE) if args.resume else {'seen_names': [], 'bands': [], 'last_tag_idx': 0, 'last_page': 0}
    seen_names = set(progress.get('seen_names', []))
    bands_list = progress.get('bands', [])
    
    print(f"\n🎸 Récupération de {args.limit} groupes metal via Last.fm...")
    
    for tag_idx, tag in enumerate(tqdm(METAL_TAGS[progress['last_tag_idx']:], desc="Genres", initial=progress['last_tag_idx'])):
        actual_idx = progress['last_tag_idx'] + tag_idx
        page = progress['last_page'] if tag_idx == 0 else 1
        
        while page <= 5 and len(bands_list) < args.limit:
            artists = client.get_top_artists(tag, limit=100, page=page)
            if not artists: break
            
            for artist in artists:
                if len(bands_list) >= args.limit: break
                name = artist.get('name', '').strip()
                if not name or name in seen_names: continue
                
                seen_names.add(name)
                info = client.get_artist_info(name)
                if info:
                    processed = process_artist(info, tag)
                    if processed: bands_list.append(processed)
            
            progress.update({'seen_names': list(seen_names), 'bands': bands_list, 'last_tag_idx': actual_idx, 'last_page': page})
            save_progress(PROGRESS_FILE, progress)
            page += 1
        progress['last_page'] = 0 # Reset pour le prochain tag

    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump({'metadata': {'total': len(bands_list), 'source': 'Last.fm', 'date': datetime.utcnow().isoformat()}, 'bands': bands_list}, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Terminé ! {len(bands_list)} groupes sauvegardés dans {args.output}")

if __name__ == '__main__':
    main()
