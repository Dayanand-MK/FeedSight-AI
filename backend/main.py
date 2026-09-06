from contextlib import asynccontextmanager
from fastapi import FastAPI
from backend.app.api.assessment import router as assessment_router
from backend.app.database.init_db import initialize_database
from backend.app.api.sync import router as sync_router

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

app.include_router(assessment_router)
app.include_router(sync_router)

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