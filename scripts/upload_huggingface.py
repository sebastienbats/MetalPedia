#!/usr/bin/env python3
"""Upload le dataset vers HuggingFace Datasets."""

from datasets import Dataset
from pathlib import Path
import pandas as pd
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

HF_REPO_ID = "your-username/metalpedia-bands"
DATASET_PATH = Path("dataset_export")


def upload_to_huggingface():
    parquet_files = list(DATASET_PATH.glob("*.parquet"))
    if not parquet_files:
        raise FileNotFoundError("No parquet file found. Run export_dataset.py first.")

    df = pd.read_parquet(parquet_files[0])
    logger.info(f"Loaded {len(df)} bands")

    dataset = Dataset.from_pandas(df)
    dataset_dict = dataset.train_test_split(test_size=0.1, seed=42)
    dataset_dict.push_to_hub(HF_REPO_ID)

    logger.info(f"✅ Dataset uploaded to https://huggingface.co/datasets/{HF_REPO_ID}")


if __name__ == "__main__":
    upload_to_huggingface()
