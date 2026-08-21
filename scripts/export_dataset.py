#!/usr/bin/env python3
"""Exporte les données MetalPedia vers des datasets publics."""

import pandas as pd
import requests
import time
from datetime import datetime
from pathlib import Path
from typing import List, Dict
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

METAL_API_BASE = "https://www.metal-api.dev/rest/v1"
OUTPUT_DIR = Path("dataset_export")
OUTPUT_DIR.mkdir(exist_ok=True)

GENRES = [
    'Black Metal', 'Death Metal', 'Heavy Metal', 'Thrash Metal',
    'Power Metal', 'Doom Metal', 'Progressive Metal', 'Folk Metal',
]


def fetch_bands_by_genre(genre: str) -> List[Dict]:
    url = f"{METAL_API_BASE}/search/bands/genre/{genre}"
    logger.info(f"Fetching genre: {genre}")
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        bands = response.json()
        enriched = []
        for band in bands:
            enriched.append({
                'band_id': band.get('id'),
                'name': band.get('name'),
                'genre': genre,
                'country': band.get('country', 'Unknown'),
                'formed': band.get('formed'),
            })
            time.sleep(0.1)
        return enriched
    except Exception as e:
        logger.error(f"Error fetching {genre}: {e}")
        return []


def export_to_csv():
    all_bands = []
    for genre in GENRES:
        bands = fetch_bands_by_genre(genre)
        all_bands.extend(bands)
        time.sleep(2)

    df = pd.DataFrame(all_bands)
    df = df.drop_duplicates(subset=['band_id'])
    df['formed_year'] = pd.to_numeric(df['formed'], errors='coerce')

    output_path = OUTPUT_DIR / f"metal_bands_{datetime.now().strftime('%Y%m%d')}.csv"
    df.to_csv(output_path, index=False)
    logger.info(f"✅ Exported {len(df)} bands to {output_path}")
    return output_path


def export_to_parquet():
    all_bands = []
    for genre in GENRES:
        bands = fetch_bands_by_genre(genre)
        all_bands.extend(bands)

    df = pd.DataFrame(all_bands)
    df = df.drop_duplicates(subset=['band_id'])

    output_path = OUTPUT_DIR / f"metal_bands_{datetime.now().strftime('%Y%m%d')}.parquet"
    df.to_parquet(output_path, index=False, compression='snappy')
    logger.info(f"✅ Exported Parquet: {output_path}")
    return output_path


if __name__ == "__main__":
    logger.info("🚀 Starting dataset export...")
    csv_path = export_to_csv()
    parquet_path = export_to_parquet()
    logger.info("✅ Export completed!")
