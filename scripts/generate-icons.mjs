#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════
 * GÉNÉRATEUR D'ICÔNES PWA
 * ═══════════════════════════════════════════
 * Convertit public/icon.svg en plusieurs tailles PNG
 * nécessaires pour la PWA et les différentes plateformes.
 *
 * Usage : node scripts/generate-icons.mjs
 * Dépendance : npm install -D sharp
 */

import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// ═══════════════════════════════════════════
// CONFIGURATION DES TAILLES
// ═══════════════════════════════════════════

const ICON_SIZES = [
  { size: 192, name: 'icon-192.png', purpose: 'any' },
  { size: 512, name: 'icon-512.png', purpose: 'any' },
  { size: 512, name: 'icon-512-maskable.png', purpose: 'maskable', padding: 0.15 },
  { size: 180, name: 'apple-touch-icon.png', purpose: 'apple' },
  { size: 32, name: 'favicon-32.png', purpose: 'favicon' },
  { size: 16, name: 'favicon-16.png', purpose: 'favicon' },
];

const OUTPUT_DIR = join(ROOT, 'public', 'icons');

// ═══════════════════════════════════════════
// FONCTIONS
// ═══════════════════════════════════════════

async function ensureOutputDir() {
  try {
    await mkdir(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Dossier de sortie : ${OUTPUT_DIR}`);
  } catch (error) {
    console.error('Erreur création dossier:', error);
    process.exit(1);
  }
}

async function generateIcon(svgBuffer, config) {
  const { size, name, purpose, padding = 0 } = config;

  try {
    let pipeline = sharp(svgBuffer, { density: 300 });

    // Appliquer un padding pour les icônes maskable
    if (padding > 0) {
      const paddingSize = Math.floor(size * padding);
      const innerSize = size - paddingSize * 2;

      pipeline = pipeline
        .resize(innerSize, innerSize)
        .extend({
          top: paddingSize,
          bottom: paddingSize,
          left: paddingSize,
          right: paddingSize,
          background: { r: 10, g: 10, b: 10, alpha: 1 },
        });
    } else {
      pipeline = pipeline.resize(size, size);
    }

    const outputPath = join(OUTPUT_DIR, name);
    await pipeline.png({ quality: 90 }).toFile(outputPath);

    console.log(`✅ ${name} (${size}x${size}) - ${purpose}`);
  } catch (error) {
    console.error(`❌ Erreur génération ${name}:`, error.message);
  }
}

// ═══════════════════════════════════════════
// EXÉCUTION PRINCIPALE
// ═══════════════════════════════════════════

async function main() {
  console.log('🎨 Génération des icônes PWA...\n');

  const svgPath = join(ROOT, 'public', 'icon.svg');

  try {
    const svgBuffer = await readFile(svgPath);
    await ensureOutputDir();

    for (const config of ICON_SIZES) {
      await generateIcon(svgBuffer, config);
    }

    console.log('\n✨ Toutes les icônes ont été générées avec succès !');
    console.log('\n📝 N\'oubliez pas de vérifier public/manifest.json');
  } catch (error) {
    console.error('Erreur fatale:', error);
    console.error('\n💡 Vérifiez que public/icon.svg existe');
    console.error('💡 Installez sharp : npm install -D sharp');
    process.exit(1);
  }
}

main();
