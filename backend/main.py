from contextlib import asynccontextmanager
from fastapi import FastAPI
from backend.app.api.assessment import router as assessment_router
from backend.app.database.init_db import initialize_database
from backend.app.api.sync import router as sync_router
from backend.app.api.simulation import router as simulation_router
from backend.app.api.prediction import router as prediction_router
from fastapi.middleware.cors import CORSMiddleware

@asynccontextmanager
async def lifespan(app : FastAPI):
    initialize_database()
    yield

app = FastAPI(
    title = "FeedSight-AI API",
    description = "AI-enabled feed and silagequality assessment platform",
    version = "0.1.0",
    lifespan = lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(assessment_router)
app.include_router(sync_router)
app.include_router(simulation_router)
app.include_router(prediction_router)

@app.get("/")
def root():
    return {
        "project" : "FeedSight-AI",
        "status" : "running",
    }

@app.get("/health")
def health_check():
    return {
        "status" : "healthy",
    }