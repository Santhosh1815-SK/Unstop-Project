import os
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from config import settings
from logger import logger
from routers import health, agents, scenarios, evaluations, regression, demo
import traceback

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AgentCI API", debug=settings.DEBUG)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={"message": "Internal Server Error", "details": str(exc) if settings.DEBUG else None},
    )

app.include_router(health.router)
app.include_router(agents.router)
app.include_router(scenarios.router)
app.include_router(scenarios.top_router)
app.include_router(evaluations.router)
app.include_router(evaluations.evaluation_singular_router)
app.include_router(evaluations.traces_router)
app.include_router(evaluations.reports_router)
app.include_router(regression.router)
app.include_router(demo.router)

# Mount frontend dist static files for unified single-host deployment
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api"):
            return JSONResponse(status_code=404, content={"message": "API Not Found"})
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
