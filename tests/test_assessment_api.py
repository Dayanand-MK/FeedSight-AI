import sqlite3
import pytest
from fastapi.testclient import TestClient
from backend.app.database import connection
from backend.app.database.init_db import initialize_database
from backend.main import app

@pytest.fixture
def client(tmp_path,monkeypatch):
    monkeypatch.setattr(connection,'DATABASE_PATH',tmp_path/'test.db')
    monkeypatch.setenv('SUPABASE_ENABLED','false')
    with TestClient(app) as client:
        yield client

def sample(**patch):
    return dict(feed_type='maize_silage',temperature=28,humidity=65,moisture=65,ph=4.1,**patch)

def test_assess_and_list(client):
    response=client.post('/api/v1/assess',json=sample())
    assert response.status_code==200
    result=response.json()
    assert result['prediction']['confidence'] is None
    assert result['prediction']['quality_score']==100
    rows=client.get('/api/v1/assessments').json()
    assert rows[0]['sample_id']==result['sample']['sample_id']
    assert rows[0]['confidence'] is None

@pytest.mark.parametrize('patch,score', [({'moisture':76},80),({'humidity':90},85),({'ph':5.5},80),({'moisture':80,'temperature':40,'humidity':90,'ph':6.2},25)])
def test_risk_flags(client,patch,score):
    payload=sample();payload.update(patch)
    assert client.post('/api/v1/assess',json=payload).json()['prediction']['quality_score']==score

@pytest.mark.parametrize('patch',[{'ph':15},{'humidity':101},{'moisture':-1},{'temperature':100},{'feed_type':'unknown'}])
def test_invalid(client,patch):
    payload=sample();payload.update(patch)
    assert client.post('/api/v1/assess',json=payload).status_code==422

def test_simulation_source(client):
    r=client.post('/api/v1/simulation/run/spoilage')
    assert r.status_code==200
    assert r.json()['sample']['source']=='virtual'
    assert client.get('/api/v1/assessments').json()[0]['source']=='virtual'
    assert client.get('/api/v1/simulation/reading/missing').status_code==404

def test_disabled_sync(client):
    assert client.post('/api/v1/sync').json()['enabled'] is False

def test_missing_model_does_not_disable_screening(client,monkeypatch,tmp_path):
    from ai.inference import predictor as module
    module.get_predictor.cache_clear()
    monkeypatch.setattr(module,'MODEL_PATH',tmp_path/'missing.joblib')
    assert client.get('/health').status_code==200
    assert client.get('/api/v1/model-info').status_code==503
    assert client.post('/api/v1/assess',json=sample()).status_code==200
    module.get_predictor.cache_clear()

def test_legacy_database_migration(tmp_path,monkeypatch):
    path=tmp_path/'legacy.db';monkeypatch.setattr(connection,'DATABASE_PATH',path)
    initialize_database()
    with sqlite3.connect(path) as db:
        sql=db.execute("SELECT sql FROM sqlite_master WHERE name='assessments'").fetchone()[0]
        db.execute('DROP TABLE assessments')
        db.execute(sql.replace('confidence REAL,','confidence REAL NOT NULL,'))
        db.execute("INSERT INTO assessments (sample_id,feed_type,moisture,temperature,ph,humidity,quality_class,quality_score,spoilage_risk,confidence) VALUES ('keep','maize_silage',65,28,4.1,65,'Good',100,'Low',0.7)")
    initialize_database();initialize_database()
    with sqlite3.connect(path) as db:
        assert db.execute('SELECT sample_id FROM assessments').fetchone()[0]=='keep'
        assert next(c for c in db.execute('PRAGMA table_info(assessments)') if c[1]=='confidence')[3]==0
