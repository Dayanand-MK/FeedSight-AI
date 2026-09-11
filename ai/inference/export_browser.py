"""Export existing sklearn Gradient Boosting trees to a small offline JSON runtime.

The browser accepts only complete measured inputs inside observed feature ranges.
Parity fixtures use the actual dataset, never fabricated scientific measurements.
"""
import json
from pathlib import Path
import joblib
import pandas as pd

ROOT=Path(__file__).resolve().parents[2]
def main():
    model=joblib.load(ROOT/'ai/models/feedsight_fqi_model.joblib')
    features=list(model.feature_names_in_)
    data=pd.read_excel(ROOT/'ai/datasets/raw/datasilage.xlsx',sheet_name='elab.all')[features].apply(pd.to_numeric,errors='coerce')
    reg=model.named_steps['model']
    trees=[]
    for estimator in reg.estimators_[:,0]:
        t=estimator.tree_
        trees.append({'left':t.children_left.tolist(),'right':t.children_right.tolist(),'feature':t.feature.tolist(),'threshold':t.threshold.tolist(),'value':t.value[:,0,0].tolist()})
    payload={'features':features,'initial':float(reg.init_.constant_[0,0]),'learningRate':reg.learning_rate,'trees':trees,'ranges':{k:[float(data[k].min()),float(data[k].max())] for k in features},'metadata':{'name':'Existing FQI Gradient Boosting model','target':'Fermentative Quality Index','evaluation':'Historical random-split results used for model selection; not independent validation. See validated_metrics.json for a separate grouped experiment.','featureImportance':dict(zip(features,reg.feature_importances_.tolist()))}}
    output=ROOT/'frontend/public/models';output.mkdir(parents=True,exist_ok=True)
    (output/'fqi-browser.json').write_text(json.dumps(payload,separators=(',',':')),encoding='utf-8')
    rows=data.dropna().iloc[::7]
    fixtures=[{'input':row.to_dict(),'expected':float(pred)} for (_,row),pred in zip(rows.iterrows(),model.predict(rows))]
    (ROOT/'ai/evaluation/browser_parity.json').write_text(json.dumps(fixtures),encoding='utf-8')
    print(f'Exported {len(trees)} trees, {len(fixtures)} parity fixtures.')
if __name__=='__main__':main()
