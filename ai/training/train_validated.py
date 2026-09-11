"""Grouped validation; legacy model and metrics are never overwritten."""
import json
from pathlib import Path
import joblib
import numpy as np
from sklearn.base import clone
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import GroupShuffleSplit, GroupKFold, cross_validate
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from ai.preprocessing.prepare_validated import prepare
from ai.preprocessing.preprocess import FEATURES, TARGET

ROOT=Path(__file__).resolve().parents[2]

def metrics(y,p):
    return {'MAE':float(mean_absolute_error(y,p)), 'RMSE':float(np.sqrt(mean_squared_error(y,p))), 'R2':float(r2_score(y,p))}

def main():
    df=prepare(); X=df[FEATURES]; y=df[TARGET]; groups=df.trial
    train,test=next(GroupShuffleSplit(n_splits=1,test_size=.2,random_state=42).split(X,y,groups))
    cv=GroupKFold(n_splits=min(4,groups.iloc[train].nunique()))
    candidates={
        'ridge':make_pipeline(SimpleImputer(strategy='median'),StandardScaler(),Ridge()),
        'random_forest':make_pipeline(SimpleImputer(strategy='median'),RandomForestRegressor(n_estimators=150,min_samples_leaf=3,random_state=42,n_jobs=1)),
        'gradient_boosting':make_pipeline(SimpleImputer(strategy='median'),GradientBoostingRegressor(n_estimators=200,learning_rate=.05,max_depth=3,random_state=42)),
    }
    results={}
    for name,model in candidates.items():
        scores=cross_validate(model,X.iloc[train],y.iloc[train],groups=groups.iloc[train],cv=cv,scoring={'mae':'neg_mean_absolute_error','mse':'neg_mean_squared_error','r2':'r2'})
        results[name]={'MAE':float(-scores['test_mae'].mean()),'RMSE':float(np.sqrt(-scores['test_mse']).mean()),'R2':float(scores['test_r2'].mean()),'fold_R2':scores['test_r2'].tolist()}
    best=min(results,key=lambda k:results[k]['RMSE'])
    model=clone(candidates[best]).fit(X.iloc[train],y.iloc[train])
    prediction=model.predict(X.iloc[test])
    report={'selected':best,'selection':'minimum training-only grouped CV RMSE','group_column':'ref.trial','train_trials':sorted(groups.iloc[train].unique().tolist()),'test_trials':sorted(groups.iloc[test].unique().tolist()),'train_rows':len(train),'test_rows':len(test),'validation':results,'holdout':metrics(y.iloc[test],prediction),'limitations':['Only five trial groups; one held-out trial is not external validation.','FQI may be calculated from fermentation features; predicting the index does not validate toxin safety or causal effects.','No calibrated confidence or Good/Moderate/Poor labels.','Nutrition targets exist but a validated nutrition model is not provided.','No trained vision model or spectral arrays.']}
    (ROOT/'ai/evaluation/validated_metrics.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
    joblib.dump(model,ROOT/'ai/models/fqi_validated.joblib')
    df.assign(split=np.where(np.isin(np.arange(len(df)),test),'test','train'))[['source_row','trial','split']].to_csv(ROOT/'ai/evaluation/validated_splits.csv',index=False)
    # Always export the existing GB model separately for compatibility with the API.
    print(json.dumps(report,indent=2))

if __name__=='__main__':main()
