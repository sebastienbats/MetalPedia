/**
 * ═══════════════════════════════════════════════════════════
 * SCRIPT D'IMPORT DES IMAGES DEPUIS LAST.FM
 * ═══════════════════════════════════════════════════════════
 * 
 * Usage :
 *   node scripts/import-lastfm-images.js
 *   node scripts/import-lastfm-images.js --dry-run
 *   node scripts/import-lastfm-images.js --limit 100
 *   node scripts/import-lastfm-images.js --force
 * 
 * Variables d'environnement requises (.env.local) :
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - LASTFM_API_KEY
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

// ═══════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════
const CONFIG = {
  // Rate limiting Last.fm (5 requêtes/seconde recommandé)
  delayBetweenRequests: 250, // ms (4 req/s pour sécurité)
  
  // Taille des lots
  batchSize: 50,
  
  // Timeout par requête
  timeout: 10000, // 10 secondes
  
  // Limit par défaut (0 = tous)
  defaultLimit: 0,
};

// ═══════════════════════════════════════════════════════════
// PARSING DES ARGUMENTS CLI
// ═══════════════════════════════════════════════════════════
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FORCE = args.includes('--force');
const LIMIT_ARG = args.find(a => a.startsWith('--limit='));
const LIMIT = LIMIT_ARG 
  ? parseInt(LIMIT_ARG.split('=')[1], 10) 
  : CONFIG.defaultLimit;

// ═══════════════════════════════════════════════════════════
// VÉRIFICATION DES VARIABLES D'ENVIRONNEMENT
// ═══════════════════════════════════════════════════════════
const {
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  LASTFM_API_KEY,
} = process.env;

if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Erreur : Variables Supabase manquantes dans .env.local');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!LASTFM_API_KEY) {
  console.error('❌ Erreur : LASTFM_API_KEY manquante dans .env.local');
  console.error('   → Obtiens une clé sur https://www.last.fm/api/account/create');
  process.exit(1);
}

// ═══════════════════════════════════════════════════════════
// CLIENT SUPABASE (avec service role pour bypass RLS)
// ═══════════════════════════════════════════════════════════
const supabase = createClient(
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Récupère l'image d'un artiste depuis Last.fm
 * @param {string} artistName - Nom de l'artiste
 * @returns {Promise<string|null>} URL de l'image ou null
 */
async function fetchImageFromLastfm(artistName) {
  try {
    const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getInfo&artist=${encodeURIComponent(artistName)}&api_key=${LASTFM_API_KEY}&format=json`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error || !data.artist) {
      return null;
    }
    
    // Last.fm retourne un tableau d'images de différentes tailles
    // On cherche la plus grande (extralarge > large > medium > small)
    const images = data.artist.image || [];
    
    // Ordre de préférence : extralarge, large, medium, small
    const preferredSizes = ['extralarge', 'large', 'medium', 'small'];
    
    for (const size of preferredSizes) {
      const img = images.find(i => i.size === size);
      if (img && img['#text'] && img['#text'].trim() !== '') {
        return img['#text'];
      }
    }
    
    // Fallback : première image non vide
    const anyImage = images.find(i => i['#text'] && i['#text'].trim() !== '');
    return anyImage ? anyImage['#text'] : null;
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn(`   ⏱️  Timeout pour "${artistName}"`);
    } else {
      console.warn(`   ⚠️  Erreur Last.fm pour "${artistName}": ${error.message}`);
    }
    return null;
  }
}

/**
 * Met à jour l'image d'un groupe dans Supabase
 */
async function updateBandImage(bandId, imageUrl) {
  if (DRY_RUN) return true;
  
  const { error } = await supabase
    .from('bands')
    .update({ image_url: imageUrl })
    .eq('id', bandId);
  
  if (error) {
    console.error(`   ❌ Erreur DB pour ID ${bandId}:`, error.message);
    return false;
  }
  return true;
}

// ═══════════════════════════════════════════════════════════
// FONCTION PRINCIPALE
// ═══════════════════════════════════════════════════════════
async function main() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   🎸 IMPORT DES IMAGES LAST.FM DANS METALPEDIA           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  
  if (DRY_RUN) {
    console.log('🧪 MODE DRY-RUN : Aucune modification en base');
  }
  if (FORCE) {
    console.log('⚡ MODE FORCE : Écrasement des images existantes');
  }
  console.log('');
  
  // ─────────────────────────────────────────────────────
  // 1. RÉCUPÉRER LES GROUPES À TRAITER
  // ─────────────────────────────────────────────────────
  console.log('📊 Récupération des groupes depuis Supabase...');
  
  let query = supabase
    .from('bands')
    .select('id, name, genre, image_url');
  
  if (!FORCE) {
    // Par défaut, on ne traite que les groupes sans image
    query = query.or('image_url.is.null,image_url.eq.""');
  }
  
  if (LIMIT > 0) {
    query = query.limit(LIMIT);
  }
  
  const { data: bands, error } = await query;
  
  if (error) {
    console.error('❌ Erreur Supabase:', error.message);
    process.exit(1);
  }
  
  if (!bands || bands.length === 0) {
    console.log('✅ Aucun groupe à traiter !');
    return;
  }
  
  console.log(`   → ${bands.length} groupes à traiter`);
  console.log('');
  
  // ─────────────────────────────────────────────────────
  // 2. TRAITEMENT PAR LOTS
  // ─────────────────────────────────────────────────────
  const stats = {
    total: bands.length,
    processed: 0,
    updated: 0,
    notFound: 0,
    errors: 0,
    skipped: 0,
  };
  
  const startTime = Date.now();
  
  for (let i = 0; i < bands.length; i += CONFIG.batchSize) {
    const batch = bands.slice(i, i + CONFIG.batchSize);
    const batchNumber = Math.floor(i / CONFIG.batchSize) + 1;
    const totalBatches = Math.ceil(bands.length / CONFIG.batchSize);
    
    console.log(`━━━ Lot ${batchNumber}/${totalBatches} (${batch.length} groupes) ━━━`);
    
    for (const band of batch) {
      stats.processed++;
      const progress = ((stats.processed / stats.total) * 100).toFixed(1);
      
      process.stdout.write(
        `\r[${stats.processed}/${stats.total}] (${progress}%) ${band.name.substring(0, 30).padEnd(30)} `
      );
      
      // Vérifier si le groupe a déjà une image (mode non-force)
      if (!FORCE && band.image_url && band.image_url.trim() !== '') {
        process.stdout.write('⏭️  skip\n');
        stats.skipped++;
        continue;
      }
      
      // Appeler Last.fm
      const imageUrl = await fetchImageFromLastfm(band.name);
      
      if (imageUrl) {
        const success = await updateBandImage(band.id, imageUrl);
        if (success) {
          process.stdout.write(`✅ ${imageUrl.substring(0, 50)}...\n`);
          stats.updated++;
        } else {
          stats.errors++;
        }
      } else {
        process.stdout.write('❌ non trouvé\n');
        stats.notFound++;
      }
      
      // Rate limiting
      await sleep(CONFIG.delayBetweenRequests);
    }
    
    console.log('');
  }
  
  // ─────────────────────────────────────────────────────
  // 3. RÉSUMÉ FINAL
  // ─────────────────────────────────────────────────────
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                    📊 RÉSUMÉ FINAL                       ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`  ⏱️  Durée totale       : ${duration}s`);
  console.log(`  📦 Groupes traités     : ${stats.processed}/${stats.total}`);
  console.log(`  ✅ Images ajoutées     : ${stats.updated}`);
  console.log(`  ❌ Non trouvés         : ${stats.notFound}`);
  console.log(`  ⏭️  Ignorés            : ${stats.skipped}`);
  console.log(`  ⚠️  Erreurs            : ${stats.errors}`);
  console.log('');
  
  if (DRY_RUN) {
    console.log('🧪 Mode dry-run : rien n\'a été écrit en base.');
    console.log('   Relance sans --dry-run pour appliquer les changements.');
  } else if (stats.updated > 0) {
    console.log(`🎉 ${stats.updated} groupes ont maintenant une image !`);
  }
  console.log('');
}

// ═══════════════════════════════════════════════════════════
// EXÉCUTION
// ═══════════════════════════════════════════════════════════
main().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
