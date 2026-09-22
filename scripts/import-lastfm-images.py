"""
═══════════════════════════════════════════════════════════
SCRIPT D'IMPORT DES IMAGES DEPUIS LAST.FM (Version Python)
═══════════════════════════════════════════════════════════

Usage :
    python scripts/import-lastfm-images.py
    python scripts/import-lastfm-images.py --dry-run
    python scripts/import-lastfm-images.py --limit 100
    python scripts/import-lastfm-images.py --force

Variables d'environnement requises (.env.local) :
    - NEXT_PUBLIC_SUPABASE_URL
    - SUPABASE_SERVICE_ROLE_KEY
    - LASTFM_API_KEY
"""

import os
import sys
import time
import argparse
import requests
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv
from supabase import create_client, Client

# ═══════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════
CONFIG = {
    "delay_between_requests": 0.25,  # secondes (4 req/s pour sécurité)
    "batch_size": 50,
    "timeout": 10,  # secondes
    "default_limit": 0,  # 0 = tous
}

# ═══════════════════════════════════════════════════════════
# COULEURS ANSI POUR LA CONSOLE
# ═══════════════════════════════════════════════════════════
class Colors:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN = "\033[96m"
    GRAY = "\033[90m"

def colored(text: str, color: str) -> str:
    """Colorise un texte pour la console."""
    return f"{color}{text}{Colors.RESET}"

def print_header(title: str) -> None:
    """Affiche un en-tête stylisé."""
    print()
    print(colored("╔═══════════════════════════════════════════════════════════╗", Colors.CYAN))
    print(colored(f"║   {title:<57} ║", Colors.CYAN + Colors.BOLD))
    print(colored("╚═══════════════════════════════════════════════════════════╝", Colors.CYAN))
    print()

# ═══════════════════════════════════════════════════════════
# PARSING DES ARGUMENTS CLI
# ═══════════════════════════════════════════════════════════
def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Import des images de groupes depuis Last.fm vers Supabase",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemples :
    python scripts/import-lastfm-images.py --dry-run --limit 10
    python scripts/import-lastfm-images.py --limit 100
    python scripts/import-lastfm-images.py --force
        """
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Mode test : aucune modification en base"
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Écrase les images existantes"
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=CONFIG["default_limit"],
        help="Nombre maximum de groupes à traiter (0 = tous)"
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=CONFIG["batch_size"],
        help="Taille des lots de traitement"
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=CONFIG["delay_between_requests"],
        help="Délai entre les requêtes Last.fm (secondes)"
    )
    return parser.parse_args()

# ═══════════════════════════════════════════════════════════
# CHARGEMENT DES VARIABLES D'ENVIRONNEMENT
# ═══════════════════════════════════════════════════════════
def load_environment() -> Dict[str, str]:
    """Charge et valide les variables d'environnement."""
    # Essayer plusieurs chemins possibles
    env_paths = [".env.local", ".env", "env.local"]
    for path in env_paths:
        if os.path.exists(path):
            load_dotenv(path)
            print(colored(f"✓ Variables chargées depuis {path}", Colors.GRAY))
            break
    else:
        print(colored("⚠ Aucun fichier .env trouvé, utilisation des variables système", Colors.YELLOW))
    
    supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    lastfm_key = os.getenv("LASTFM_API_KEY")
    
    errors = []
    if not supabase_url:
        errors.append("NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_URL")
    if not supabase_key:
        errors.append("SUPABASE_SERVICE_ROLE_KEY")
    if not lastfm_key:
        errors.append("LASTFM_API_KEY (→ https://www.last.fm/api/account/create)")
    
    if errors:
        print(colored("\n❌ Erreur : Variables d'environnement manquantes :", Colors.RED + Colors.BOLD))
        for err in errors:
            print(colored(f"   - {err}", Colors.RED))
        print()
        sys.exit(1)
    
    return {
        "supabase_url": supabase_url,
        "supabase_key": supabase_key,
        "lastfm_key": lastfm_key,
    }

# ═══════════════════════════════════════════════════════════
# FONCTIONS LAST.FM
# ═══════════════════════════════════════════════════════════
def fetch_image_from_lastfm(artist_name: str, api_key: str) -> Optional[str]:
    """
    Récupère l'URL de l'image d'un artiste depuis Last.fm.
    
    Args:
        artist_name: Nom de l'artiste/groupe
        api_key: Clé API Last.fm
    
    Returns:
        URL de l'image ou None si non trouvée
    """
    try:
        url = "https://ws.audioscrobbler.com/2.0/"
        params = {
            "method": "artist.getInfo",
            "artist": artist_name,
            "api_key": api_key,
            "format": "json",
        }
        
        response = requests.get(url, params=params, timeout=CONFIG["timeout"])
        
        if response.status_code != 200:
            if response.status_code == 404:
                return None
            raise Exception(f"HTTP {response.status_code}")
        
        data = response.json()
        
        if "error" in data or "artist" not in data:
            return None
        
        # Last.fm retourne un tableau d'images de différentes tailles
        images = data.get("artist", {}).get("image", [])
        
        if not images:
            return None
        
        # Ordre de préférence : extralarge > large > medium > small
        preferred_sizes = ["extralarge", "large", "medium", "small"]
        
        for size in preferred_sizes:
            for img in images:
                if img.get("size") == size:
                    img_url = img.get("#text", "").strip()
                    if img_url:
                        return img_url
        
        # Fallback : première image non vide
        for img in images:
            img_url = img.get("#text", "").strip()
            if img_url:
                return img_url
        
        return None
        
    except requests.exceptions.Timeout:
        print(colored(f"\n   ⏱️  Timeout pour \"{artist_name}\"", Colors.YELLOW))
        return None
    except requests.exceptions.RequestException as e:
        print(colored(f"\n   ⚠️  Erreur réseau pour \"{artist_name}\": {e}", Colors.YELLOW))
        return None
    except Exception as e:
        print(colored(f"\n   ⚠️  Erreur pour \"{artist_name}\": {e}", Colors.YELLOW))
        return None

# ═══════════════════════════════════════════════════════════
# FONCTIONS SUPABASE
# ═══════════════════════════════════════════════════════════
def get_bands_to_process(
    supabase: Client, 
    force: bool, 
    limit: int
) -> List[Dict[str, Any]]:
    """Récupère les groupes à traiter depuis Supabase."""
    query = supabase.table("bands").select("id, name, genre, image_url")
    
    if not force:
        # Traiter uniquement les groupes sans image
        query = query.or_("image_url.is.null,image_url.eq.")
    
    if limit > 0:
        query = query.limit(limit)
    
    response = query.execute()
    return response.data or []

def update_band_image(
    supabase: Client, 
    band_id: int, 
    image_url: str,
    dry_run: bool
) -> bool:
    """Met à jour l'image d'un groupe dans Supabase."""
    if dry_run:
        return True
    
    try:
        supabase.table("bands").update({
            "image_url": image_url
        }).eq("id", band_id).execute()
        return True
    except Exception as e:
        print(colored(f"\n   ❌ Erreur DB pour ID {band_id}: {e}", Colors.RED))
        return False

# ═══════════════════════════════════════════════════════════
# FONCTION PRINCIPALE
# ═══════════════════════════════════════════════════════════
def main():
    args = parse_arguments()
    
    # Affichage de l'en-tête
    print_header("🎸 IMPORT DES IMAGES LAST.FM DANS METALPEDIA")
    
    if args.dry_run:
        print(colored("🧪 MODE DRY-RUN : Aucune modification en base", Colors.MAGENTA + Colors.BOLD))
    if args.force:
        print(colored("⚡ MODE FORCE : Écrasement des images existantes", Colors.YELLOW + Colors.BOLD))
    print()
    
    # Chargement des variables d'environnement
    env = load_environment()
    
    # Connexion Supabase
    try:
        supabase: Client = create_client(env["supabase_url"], env["supabase_key"])
    except Exception as e:
        print(colored(f"❌ Erreur de connexion Supabase : {e}", Colors.RED))
        sys.exit(1)
    
    # ─────────────────────────────────────────────────────
    # 1. RÉCUPÉRER LES GROUPES À TRAITER
    # ─────────────────────────────────────────────────────
    print(colored("📊 Récupération des groupes depuis Supabase...", Colors.BLUE + Colors.BOLD))
    
    try:
        bands = get_bands_to_process(supabase, args.force, args.limit)
    except Exception as e:
        print(colored(f"❌ Erreur Supabase : {e}", Colors.RED))
        sys.exit(1)
    
    if not bands:
        print(colored("✅ Aucun groupe à traiter !", Colors.GREEN))
        return
    
    print(f"   → {colored(str(len(bands)), Colors.BOLD)} groupes à traiter")
    print()
    
    # ─────────────────────────────────────────────────────
    # 2. TRAITEMENT PAR LOTS
    # ─────────────────────────────────────────────────────
    stats = {
        "total": len(bands),
        "processed": 0,
        "updated": 0,
        "not_found": 0,
        "errors": 0,
        "skipped": 0,
    }
    
    start_time = time.time()
    total_batches = (len(bands) + args.batch_size - 1) // args.batch_size
    
    for batch_num, i in enumerate(range(0, len(bands), args.batch_size), 1):
        batch = bands[i:i + args.batch_size]
        
        print(colored(f"━━━ Lot {batch_num}/{total_batches} ({len(batch)} groupes) ━━━", Colors.CYAN))
        
        for band in batch:
            stats["processed"] += 1
            progress = (stats["processed"] / stats["total"]) * 100
            band_name = band["name"][:30].ljust(30)
            
            sys.stdout.write(
                f"\r[{stats['processed']}/{stats['total']}] "
                f"({progress:.1f}%) {band_name} "
            )
            sys.stdout.flush()
            
            # Vérifier si le groupe a déjà une image (mode non-force)
            if not args.force and band.get("image_url"):
                print(colored("⏭️  skip", Colors.GRAY))
                stats["skipped"] += 1
                continue
            
            # Appeler Last.fm
            image_url = fetch_image_from_lastfm(band["name"], env["lastfm_key"])
            
            if image_url:
                success = update_band_image(supabase, band["id"], image_url, args.dry_run)
                if success:
                    print(colored(f"✅ {image_url[:50]}...", Colors.GREEN))
                    stats["updated"] += 1
                else:
                    stats["errors"] += 1
            else:
                print(colored("❌ non trouvé", Colors.RED))
                stats["not_found"] += 1
            
            # Rate limiting
            time.sleep(args.delay)
        
        print()
    
    # ─────────────────────────────────────────────────────
    # 3. RÉSUMÉ FINAL
    # ─────────────────────────────────────────────────────
    duration = time.time() - start_time
    
    print()
    print_header("📊 RÉSUMÉ FINAL")
    
    print(f"  ⏱️  Durée totale       : {colored(f'{duration:.1f}s', Colors.BOLD)}")
    print(f"  📦 Groupes traités     : {colored(f'{stats[\"processed\"]}/{stats[\"total\"]}', Colors.BOLD)}")
    print(f"  ✅ Images ajoutées     : {colored(str(stats['updated']), Colors.GREEN)}")
    print(f"  ❌ Non trouvés         : {colored(str(stats['not_found']), Colors.RED)}")
    print(f"  ⏭️  Ignorés            : {colored(str(stats['skipped']), Colors.GRAY)}")
    print(f"  ⚠️  Erreurs            : {colored(str(stats['errors']), Colors.YELLOW)}")
    print()
    
    if args.dry_run:
        print(colored("🧪 Mode dry-run : rien n'a été écrit en base.", Colors.MAGENTA))
        print(colored("   Relance sans --dry-run pour appliquer les changements.", Colors.GRAY))
    elif stats["updated"] > 0:
        print(colored(f"🎉 {stats['updated']} groupes ont maintenant une image !", Colors.GREEN + Colors.BOLD))
    print()

# ═══════════════════════════════════════════════════════════
# POINT D'ENTRÉE
# ═══════════════════════════════════════════════════════════
if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(colored("\n\n⏹️  Script interrompu par l'utilisateur.", Colors.YELLOW + Colors.BOLD))
        sys.exit(0)
    except Exception as e:
        print(colored(f"\n❌ Erreur fatale : {e}", Colors.RED + Colors.BOLD))
        sys.exit(1)
