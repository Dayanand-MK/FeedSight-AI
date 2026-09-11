"""Audit all workbook sheets and prepare un-imputed, trial-aware model data."""
import hashlib
import json
from pathlib import Path
import numpy as np
import pandas as pd
from ai.preprocessing.preprocess import FEATURES, TARGET, RAW_DATASET

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / 'ai/datasets/processed/silage_validated.csv'
REPORT = ROOT / 'ai/evaluation/dataset_audit.json'

def prepare():
    report = {'file': RAW_DATASET.name, 'sha256': hashlib.sha256(RAW_DATASET.read_bytes()).hexdigest(), 'sheets': {}}
    book = pd.ExcelFile(RAW_DATASET)
    for sheet in book.sheet_names:
        df = pd.read_excel(book, sheet_name=sheet)
        report['sheets'][sheet] = {
            'rows':len(df), 'columns':list(df.columns), 'duplicates':int(df.duplicated().sum()),
            'dtypes':{k:str(v) for k,v in df.dtypes.items()},
            'missing':{k:int(v) for k,v in df.isna().sum().items()},
            'categorical_distributions':{k:{str(a):int(b) for a,b in df[k].value_counts().items()} for k in df.select_dtypes(exclude='number').columns if df[k].nunique()<30},
            'numeric_summary':json.loads(df.describe(include='number').to_json()) if len(df.select_dtypes('number').columns) else {},
        }
    raw = pd.read_excel(book,sheet_name='elab.all')
    selected = raw[FEATURES+[TARGET]].apply(pd.to_numeric,errors='coerce').replace([np.inf,-np.inf],np.nan)
    invalid={}
    for col in FEATURES:
        mask=selected[col]<0
        if col=='pH': mask |= selected[col]>14
        elif col in ['dm.s','starch.s','ammonia.s']: mask |= selected[col]>100
        invalid[col]=int(mask.sum()); selected.loc[mask,col]=np.nan
    # Keep rows tied to a trial; missing targets cannot train a supervised model.
    selected['trial']=raw['ref.trial'].astype(str)
    selected['source_row']=raw.index+2
    selected=selected.dropna(subset=[TARGET]).drop_duplicates(subset=FEATURES+[TARGET])
    report['preparation']={'rows':len(selected),'invalid_feature_counts':invalid,'feature_missing_retained':{k:int(v) for k,v in selected[FEATURES].isna().sum().items()},'target':'continuous FQI, not safety classes','imputation':'Training folds only','groups':selected.trial.value_counts().to_dict(),'units':'See workbook dictionary keys; chemical components are lab measurements.'}
    OUTPUT.parent.mkdir(parents=True,exist_ok=True)
    selected.to_csv(OUTPUT,index=False)
    REPORT.write_text(json.dumps(report,indent=2,allow_nan=False),encoding='utf-8')
    print(f'Prepared {len(selected)} rows; raw SHA256 {report["sha256"]}')
    return selected

if __name__=='__main__': prepare()
