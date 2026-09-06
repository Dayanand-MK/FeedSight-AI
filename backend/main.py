from fastapi import FastAPI
from backend.app.api.assessment import router as assessment_router

app = FastAPI(
    title = "FeedSight-AI API",
    description = "AI-enabled feed and silagequality assessment platform",
    version = "0.1.0",
)

app.include_router(assessment_router)

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