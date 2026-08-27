#!/usr/bin/env python3
"""
Récupère des groupes metal via l'API Last.fm.

Usage:
  python fetch_metal_bands.py                        # 10 000 groupes (défaut)
  python fetch_metal_bands.py --limit 5000           # 5 000 groupes
  python fetch_metal_bands.py --output data/test.json # Fichier custom
  python fetch_metal_bands.py --resume               # Reprendre après interruption
  python fetch_metal_bands.py --reset                # Réinitialiser la progression
"""

import os
import json
import time
import re
import argparse
import requests
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Dict, List, Set
from tqdm import tqdm
from dotenv import load_dotenv

# ═══════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════

# Chargement du .env depuis la racine du projet
load_dotenv(Path(__file__).parent.parent / '.env')

LASTFM_API_KEY = os.getenv('LASTFM_API_KEY')
LASTFM_API_URL = 'http://ws.audioscrobbler.com/2.0/'
DEFAULT_OUTPUT = '../data/metal_bands.json'
DEFAULT_LIMIT = 10000
RATE_LIMIT_DELAY = 0.25  # 4 requêtes/seconde (Last.fm limite à ~5/sec)
PROGRESS_FILE = '../data/fetch_progress.json'

# ═══════════════════════════════════════════════════════════
# SOUS-GENRES METAL À EXPLORER (31 tags pour couvrir largement)
# ═══════════════════════════════════════════════════════════

METAL_TAGS = [
    # Genres majeurs
    'heavy metal', 'thrash metal', 'death metal', 'black metal',
    'power metal', 'doom metal', 'progressive metal', 'folk metal',
    'symphonic metal', 'gothic metal', 'nu metal', 'metalcore',
    'groove metal', 'industrial metal', 'speed metal',
    
    # Sous-genres spécialisés
    'melodic death metal', 'brutal death metal', 'technical death metal',
    'viking metal', 'pagan metal', 'sludge metal', 'stoner metal',
    'post-metal', 'djent', 'grindcore', 'deathcore',
    'swedish death metal', 'finnish death metal', 'norwegian black metal',
    'symphonic black metal', 'epic metal', 'true metal',
]

# ═══════════════════════════════════════════════════════════
# CLIENT API LAST.FM
# ═══════════════════════════════════════════════════════════

class LastFmClient:
    """Client HTTP pour l'API Last.fm avec rate limiting et retry."""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.session = requests.Session()
        self.request_count = 0
        
    def _request(self, params: Dict) -> Optional[Dict]:
        """Effectue une requête API avec rate limiting et retry (3 tentatives max)."""
        params['api_key'] = self.api_key
        params['format'] = 'json'
        
        for attempt in range(3):
            try:
                time.sleep(RATE_LIMIT_DELAY)
                response = self.session.get(LASTFM_API_URL, params=params, timeout=15)
                self.request_count += 1
                
                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 429:
                    wait_time = 60 * (attempt + 1)
                    print(f"\n⚠️  Rate limit atteint, attente de {wait_time}s...")
                    time.sleep(wait_time)
                elif response.status_code == 403:
                    print(f"\n❌ Clé API invalide ou quota dépassé")
                    return None
                else:
                    print(f"\n⚠️  Erreur HTTP {response.status_code}")
                    return None
                    
            except requests.RequestException as e:
                print(f"\n⚠️  Erreur réseau (tentative {attempt + 1}/3): {e}")
                time.sleep(2)
        
        return None
    
    def get_top_artists_by_tag(self, tag: str, limit: int = 100, page: int = 1) -> List[Dict]:
        """Récupère les top artistes pour un tag donné."""
        params = {
            'method': 'tag.gettopartists',
            'tag': tag,
            'limit': limit,
            'page': page,
        }
        
        data = self._request(params)
        if not data:
            return []
        
        artists = data.get('topartists', {}).get('artist', [])
        return artists if isinstance(artists, list) else []
    
    def get_artist_info(self, artist_name: str) -> Optional[Dict]:
        """Récupère les infos détaillées d'un artiste."""
        params = {
            'method': 'artist.getinfo',
            'artist': artist_name,
            'autocorrect': 1,
        }
        
        data = self._request(params)
        if not data:
            return None
        
        return data.get('artist')

# ═══════════════════════════════════════════════════════════
# TRAITEMENT DES DONNÉES
# ═══════════════════════════════════════════════════════════

# Genres metal reconnus (en minuscules pour comparaison)
METAL_GENRES = {
    'black metal', 'death metal', 'thrash metal', 'heavy metal',
    'power metal', 'doom metal', 'progressive metal', 'folk metal',
    'symphonic metal', 'gothic metal', 'nu metal', 'metalcore',
    'groove metal', 'industrial metal', 'speed metal', 'grindcore',
    'deathcore', 'sludge metal', 'stoner metal', 'viking metal',
    'pagan metal', 'post-metal', 'djent', 'melodic death metal',
    'brutal death metal', 'technical death metal', 'epic metal',
    'true metal', 'swedish death metal', 'finnish death metal',
    'norwegian black metal', 'symphonic black metal',
}

def extract_genre_from_tags(tags: List[Dict]) -> str:
    """Extrait le genre metal principal à partir des tags Last.fm."""
    for tag in tags:
        tag_name = tag.get('name', '').lower()
        if tag_name in METAL_GENRES:
            # Retourne le genre en Title Case
            return tag_name.title()
    
    return 'Metal'

def clean_biography(bio_content: str) -> str:
    """Nettoie la biographie (supprime HTML et liens Last.fm)."""
    if not bio_content:
        return ''
    
    # Supprime les balises HTML
    clean = re.sub(r'<[^>]+>', '', bio_content)
    # Supprime le lien "Read more on Last.fm" et tout ce qui suit
    clean = re.sub(r'\s*Read more on Last\.fm.*$', '', clean, flags=re.IGNORECASE | re.DOTALL)
    # Normalise les espaces
    clean = re.sub(r'\s+', ' ', clean).strip()
    
    # Limite à 2000 caractères
    return clean[:2000]

def process_artist(artist_data: Dict, source_tag: str) -> Optional[Dict]:
    """Transforme les données brutes Last.fm en format JSON pour Supabase."""
    if not artist_data:
        return None
    
    name = artist_data.get('name', '').strip()
    if not name:
        return None
    
    # Extraction des tags/genres
    tags = artist_data.get('tags', {}).get('tag', [])
    if not isinstance(tags, list):
        tags = []
    
    genre = extract_genre_from_tags(tags)
    
    # Biographie nettoyée
    bio_content = artist_data.get('bio', {}).get('content', '')
    biography = clean_biography(bio_content)
    
    # Image (prend la plus grande disponible)
    images = artist_data.get('image', [])
    image_url = None
    if images:
        for img in reversed(images):
            if img.get('#text'):
                image_url = img['#text']
                break
    
    # Listeners (popularité)
    try:
        listeners = int(artist_data.get('stats', {}).get('listeners', 0) or 0)
    except (ValueError, TypeError):
        listeners = 0
    
    # ✅ Utilisation de datetime.now(timezone.utc) au lieu de datetime.utcnow()
    now_utc = datetime.now(timezone.utc).isoformat()
    
    return {
        'name': name,
        'genre': genre,
        'country': 'Unknown',  # Last.fm ne fournit pas directement le pays
        'formed': None,
        'status': 'Active',  # Par défaut, les groupes récupérés sont considérés actifs
        'biography': biography or None,
        'image_url': image_url,
        'listeners': listeners,
        'source_tag': source_tag,
        'fetched_at': now_utc,
    }

# ═══════════════════════════════════════════════════════════
# GESTION DU PROGRESS (reprise sur interruption)
# ═══════════════════════════════════════════════════════════

def load_progress(progress_path: str) -> Dict:
    """Charge la progression depuis le fichier JSON."""
    path = Path(progress_path)
    if not path.exists():
        return {
            'seen_names': [],
            'bands': [],
            'last_tag_index': 0,
            'last_page': 0,
        }
    
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError) as e:
        print(f"⚠️  Fichier de progression corrompu: {e}")
        return {
            'seen_names': [],
            'bands': [],
            'last_tag_index': 0,
            'last_page': 0,
        }

def save_progress(progress_path: str, progress: Dict):
    """Sauvegarde la progression dans le fichier JSON."""
    path = Path(progress_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(progress, f, ensure_ascii=False)

def reset_progress(progress_path: str):
    """Réinitialise la progression."""
    path = Path(progress_path)
    if path.exists():
        path.unlink()
        print(f"🗑️  Progression réinitialisée: {progress_path}")
    else:
        print(f"ℹ️  Aucun fichier de progression à supprimer")

# ═══════════════════════════════════════════════════════════
# SCRIPT PRINCIPAL
# ═══════════════════════════════════════════════════════════

def fetch_all_metal_bands(
    limit: int = DEFAULT_LIMIT,
    resume: bool = False,
    progress_path: str = PROGRESS_FILE,
) -> List[Dict]:
    """Récupère tous les groupes metal en itérant sur les tags."""
    
    if not LASTFM_API_KEY:
        print("❌ Erreur: LASTFM_API_KEY non définie dans .env")
        print("💡 Crée un fichier .env à la racine du projet avec :")
        print("   LASTFM_API_KEY=ta_cle_api_ici")
        return []
    
    client = LastFmClient(LASTFM_API_KEY)
    
    # Chargement de la progression
    if resume:
        progress = load_progress(progress_path)
        seen_names: Set[str] = set(progress.get('seen_names', []))
        bands_list: List[Dict] = progress.get('bands', [])
        start_tag_idx = progress.get('last_tag_index', 0)
        start_page = progress.get('last_page', 0)
        print(f"\n🔄 Reprise depuis le tag {start_tag_idx}, page {start_page}")
        print(f"   ✅ {len(bands_list)} groupes déjà récupérés")
    else:
        progress = {
            'seen_names': [], 
            'bands': [], 
            'last_tag_index': 0, 
            'last_page': 0
        }
        seen_names = set()
        bands_list = []
        start_tag_idx = 0
        start_page = 0
    
    print(f"\n🎸 Démarrage de la récupération de {limit} groupes metal...")
    print(f"📊 {len(METAL_TAGS)} sous-genres à explorer")
    print(f"🔑 Clé API: {LASTFM_API_KEY[:8]}...")
    print()
    
    # Parcours de chaque tag
    for tag_idx, tag in enumerate(tqdm(METAL_TAGS[start_tag_idx:], desc="Genres", initial=start_tag_idx)):
        actual_tag_idx = start_tag_idx + tag_idx
        page = start_page if tag_idx == 0 else 1
        max_pages = 5  # 5 pages × 100 artistes = 500 artistes par tag max
        
        while page <= max_pages and len(bands_list) < limit:
            artists = client.get_top_artists_by_tag(tag, limit=100, page=page)
            
            if not artists:
                break
            
            for artist in artists:
                if len(bands_list) >= limit:
                    break
                
                artist_name = artist.get('name', '').strip()
                if not artist_name or artist_name in seen_names:
                    continue
                
                seen_names.add(artist_name)
                
                # Récupère les infos détaillées
                artist_info = client.get_artist_info(artist_name)
                if artist_info:
                    processed = process_artist(artist_info, tag)
                    if processed:
                        bands_list.append(processed)
            
            # Sauvegarde de la progression après chaque page
            progress['seen_names'] = list(seen_names)
            progress['bands'] = bands_list
            progress['last_tag_index'] = actual_tag_idx
            progress['last_page'] = page
            save_progress(progress_path, progress)
            
            page += 1
        
        # Réinitialiser la page pour le prochain tag
        start_page = 0
    
    print(f"\n✅ Récupération terminée !")
    print(f"📊 {len(bands_list)} groupes uniques récupérés")
    print(f"🌐 {client.request_count} requêtes API effectuées")
    
    return bands_list

def save_to_json(bands: List[Dict], output_path: str):
    """Sauvegarde les données en JSON."""
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    
    # ✅ Utilisation de datetime.now(timezone.utc)
    now_utc = datetime.now(timezone.utc).isoformat()
    
    with open(path, 'w', encoding='utf-8') as f:
        json.dump({
            'metadata': {
                'total_bands': len(bands),
                'fetched_at': now_utc,
                'source': 'Last.fm API',
            },
            'bands': bands,
        }, f, ensure_ascii=False, indent=2)
    
    print(f"💾 Données sauvegardées dans {output_path}")
    print(f"📦 Taille du fichier: {path.stat().st_size / 1024:.1f} KB")

# ═══════════════════════════════════════════════════════════
# CLI PRINCIPAL
# ═══════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description='Récupère des groupes metal via Last.fm',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemples:
  python fetch_metal_bands.py                        # 10 000 groupes (défaut)
  python fetch_metal_bands.py --limit 500            # 500 groupes
  python fetch_metal_bands.py --resume               # Reprendre après interruption
  python fetch_metal_bands.py --reset                # Réinitialiser la progression
        """
    )
    
    parser.add_argument('--limit', type=int, default=DEFAULT_LIMIT,
                        help=f'Nombre max de groupes à récupérer (défaut: {DEFAULT_LIMIT})')
    parser.add_argument('--output', type=str, default=DEFAULT_OUTPUT,
                        help=f'Fichier de sortie (défaut: {DEFAULT_OUTPUT})')
    parser.add_argument('--resume', action='store_true',
                        help='Reprendre après interruption')
    parser.add_argument('--reset', action='store_true',
                        help='Réinitialiser la progression et quitter')
    
    args = parser.parse_args()
    
    print("\n" + "=" * 60)
    print("🎸 METALPEDIA - Récupération via Last.fm")
    print("=" * 60)
    
    # Reset si demandé
    if args.reset:
        reset_progress(PROGRESS_FILE)
        return
    
    # Lancement de la récupération
    start_time = time.time()
    bands = fetch_all_metal_bands(args.limit, args.resume)
    
    if bands:
        save_to_json(bands, args.output)
    
    elapsed = time.time() - start_time
    print(f"\n⏱️  Temps total: {elapsed/60:.1f} minutes")

if __name__ == '__main__':
    main()
