#!/usr/bin/env python3
"""
Nettoie les albums "poubelle", supprime ceux sans MBID, et dédoublonne par URI Discogs.
Génère un rapport statistique complet avant et après le traitement.
"""
import json
from pathlib import Path

# ═══════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════
INPUT_FILE = Path("../data/metal_bands_final_complete.json")
OUTPUT_FILE = Path("../data/metal_bands_ready_for_supabase.json")

# Titres d'albums invalides ou génériques générés par Last.fm
GARBAGE_TITLES = {"null", "undefined", "title", "<unknown>", "no title", "unknown", ""}

def main():
    if not INPUT_FILE.exists():
        print(f"❌ Fichier introuvable : {INPUT_FILE}")
        return

    print(f"📂 Chargement de {INPUT_FILE}...")
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Gérer le cas où le JSON est une liste directe ou un dictionnaire avec une clé "bands"
    bands = data.get('bands', data) if isinstance(data, dict) else data
    
    # ═══════════════════════════════════════════════════════
    # STATISTIQUES AVANT TRAITEMENT
    # ═══════════════════════════════════════════════════════
    total_albums_before = sum(len(b.get('albums', [])) for b in bands)
    
    stats = {
        "initial_bands": len(bands),
        "initial_albums": total_albums_before,
        "removed_no_mbid": 0,
        "removed_garbage_title": 0,
        "removed_duplicates": 0,
    }

    print(f"🔍 Analyse initiale : {stats['initial_bands']:,} groupes, {stats['initial_albums']:,} albums.\n")
    print("🧹 Nettoyage en cours...")

    # ═══════════════════════════════════════════════════════
    # TRAITEMENT ET NETTOYAGE
    # ═══════════════════════════════════════════════════════
    cleaned_bands = []
    
    for band in bands:
        cleaned_albums = []
        seen_uris = set()
        
        for album in band.get('albums', []):
            # 1. SUPPRESSION DES ALBUMS SANS MBID (Nouvelle règle)
            if album.get('mbid') is None:
                stats['removed_no_mbid'] += 1
                continue
            
            # 2. SUPPRESSION DES TITRES "POUBELLE"
            title = (album.get('name') or album.get('title') or '').strip().lower()
            if title in GARBAGE_TITLES:
                stats['removed_garbage_title'] += 1
                continue
            
            # 3. DÉDOUBLONNAGE PAR URI DISCOGS 
            # (Garde la première occurrence, qui est souvent la plus complète)
            uri = album.get('uri', '')
            if uri and 'discogs.com/master/' in uri:
                if uri in seen_uris:
                    stats['removed_duplicates'] += 1
                    continue
                seen_uris.add(uri)
            
            # Si l'album passe tous les filtres, on le garde
            cleaned_albums.append(album)
            
        # Mettre à jour la liste des albums du groupe
        band['albums'] = cleaned_albums
        cleaned_bands.append(band)

    # ═══════════════════════════════════════════════════════
    # STATISTIQUES APRÈS TRAITEMENT
    # ═══════════════════════════════════════════════════════
    total_albums_after = sum(len(b.get('albums', [])) for b in cleaned_bands)
    stats['final_bands'] = len(cleaned_bands)
    stats['final_albums'] = total_albums_after
    stats['total_removed'] = stats['initial_albums'] - stats['final_albums']

    # ═══════════════════════════════════════════════════════
    # AFFICHAGE DU RAPPORT
    # ═══════════════════════════════════════════════════════
    print("\n" + "=" * 70)
    print("📊 RAPPORT DE NETTOYAGE DES ALBUMS")
    print("=" * 70)
    
    print("📌 AVANT TRAITEMENT :")
    print(f"   • Groupes (Bands)      : {stats['initial_bands']:>8,}")
    print(f"   • Albums total         : {stats['initial_albums']:>8,}")
    
    print("\n🗑️  ÉLÉMENTS SUPPRIMÉS :")
    print(f"   • Sans MBID (null)     : {stats['removed_no_mbid']:>8,}")
    print(f"   • Titres invalides     : {stats['removed_garbage_title']:>8,}")
    print(f"   • Doublons (URI)       : {stats['removed_duplicates']:>8,}")
    print(f"   • TOTAL supprimés      : {stats['total_removed']:>8,}")
    
    print("\n✅ APRÈS TRAITEMENT :")
    print(f"   • Groupes (Bands)      : {stats['final_bands']:>8,}")
    print(f"   • Albums total         : {stats['final_albums']:>8,}")
    
    # Calcul du taux de rétention
    retention_rate = (stats['final_albums'] / stats['initial_albums'] * 100) if stats['initial_albums'] > 0 else 0
    print(f"   • Taux de rétention    : {retention_rate:>7.1f}%")
    print("=" * 70)

    # ═══════════════════════════════════════════════════════
    # SAUVEGARDE
    # ═══════════════════════════════════════════════════════
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    
    # Conserver la structure originale (dict avec "bands" ou liste directe)
    save_data = {'bands': cleaned_bands} if isinstance(data, dict) else cleaned_bands
    
    print(f"\n💾 Sauvegarde dans : {OUTPUT_FILE}")
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(save_data, f, ensure_ascii=False, indent=2)
    
    print("✅ Nettoyage terminé avec succès !")

if __name__ == '__main__':
    main()
