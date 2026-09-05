from fastapi import FastAPI

app = FastAPI(
    title = "FeedSight-AI API",
    description = "AI-enabled feed and silagequality assessment platform",
    version = "0.1.0",
)

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