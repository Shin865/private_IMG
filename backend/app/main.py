"""
Local Image Tool — FastAPI Application Entry Point
"""
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS, ensure_directories
from app.routes import image as image_routes
from app.utils.temp_manager import periodic_cleanup


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown events."""
    # Startup
    print("=" * 50)
    print("  LOCAL IMAGE TOOL - Starting up...")
    print("=" * 50)
    
    # Create directories
    ensure_directories()
    print("[OK] Directories created")
    
    # Start periodic cleanup task
    cleanup_task = asyncio.create_task(periodic_cleanup(interval=300))
    print("[OK] Periodic cleanup task started (every 5 min)")
    
    print("[OK] Server ready!")
    print("=" * 50)
    
    yield
    
    # Shutdown
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass
    print("[OK] Server shut down gracefully")


app = FastAPI(
    title="Local Image Tool",
    description="Local/offline image processing API — no cloud, no uploads to external servers.",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(image_routes.router)

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to Local Image Tool API",
        "docs_url": "/docs",
        "health_check": "/api/health"
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "Local Image Tool",
        "version": "0.1.0",
    }
