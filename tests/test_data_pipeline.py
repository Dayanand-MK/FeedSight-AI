import hashlib
import json
from pathlib import Path
import pandas as pd

ROOT=Path(__file__).resolve().parents[1]

def test_raw_preserved_and_groups_disjoint():
    report=json.loads((ROOT/'ai/evaluation/dataset_audit.json').read_text())
    raw=ROOT/'ai/datasets/raw/datasilage.xlsx'
    assert hashlib.sha256(raw.read_bytes()).hexdigest()==report['sha256']
    split=pd.read_csv(ROOT/'ai/evaluation/validated_splits.csv')
    assert set(split[split.split=='train'].trial).isdisjoint(set(split[split.split=='test'].trial))
    data=pd.read_csv(ROOT/'ai/datasets/processed/silage_validated.csv')
    assert len(data)==len(split)==1484
    assert data['fqi'].notna().all()
    assert data['pH'].isna().sum()>0  # Missing features retained until training.

def test_metrics_are_regression_results():
    report=json.loads((ROOT/'ai/evaluation/validated_metrics.json').read_text())
    assert report['selected'] in report['validation']
    assert set(report['holdout'])=={'MAE','RMSE','R2'}
    assert report['holdout']['MAE']>=0
