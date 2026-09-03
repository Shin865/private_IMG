"""
Temp Manager — Manages temporary files with auto-cleanup.
"""
import os
import time
import uuid
import shutil
import asyncio
from pathlib import Path
from typing import Optional

from app.config import (
    UPLOAD_DIR,
    PROCESSING_DIR,
    OUTPUT_DIR,
    TEMP_FILE_TTL,
)


def generate_file_id() -> str:
    """Generate a unique file ID using UUID."""
    return str(uuid.uuid4())


def get_safe_filename(file_id: str, extension: str) -> str:
    """Generate a safe filename from file ID and extension."""
    # Ensure extension starts with dot
    if not extension.startswith('.'):
        extension = f'.{extension}'
    return f"{file_id}{extension}"


def get_upload_path(file_id: str, extension: str) -> Path:
    """Get the full path for an uploaded file."""
    return UPLOAD_DIR / get_safe_filename(file_id, extension)


def get_processing_path(file_id: str, extension: str) -> Path:
    """Get the full path for a file being processed."""
    return PROCESSING_DIR / get_safe_filename(file_id, extension)


def get_output_path(file_id: str, extension: str) -> Path:
    """Get the full path for an output file."""
    return OUTPUT_DIR / get_safe_filename(file_id, extension)


def find_file_by_id(file_id: str) -> Optional[Path]:
    """
    Find a file by its ID across all temp directories.
    Returns the first matching file path, or None.
    """
    for directory in [OUTPUT_DIR, PROCESSING_DIR, UPLOAD_DIR]:
        if directory.exists():
            for f in directory.iterdir():
                if f.stem == file_id:
                    return f
    return None


def cleanup_old_files(directory: Path, ttl: int = TEMP_FILE_TTL) -> int:
    """
    Remove files older than TTL seconds.
    Returns the number of files removed.
    """
    if not directory.exists():
        return 0
    
    removed = 0
    now = time.time()
    
    for f in directory.iterdir():
        if f.is_file():
            file_age = now - f.stat().st_mtime
            if file_age > ttl:
                try:
                    f.unlink()
                    removed += 1
                except OSError:
                    pass
    
    return removed


def cleanup_all_temp() -> dict:
    """
    Clean up all temporary directories.
    Returns cleanup stats.
    """
    stats = {}
    for name, directory in [
        ("upload", UPLOAD_DIR),
        ("processing", PROCESSING_DIR),
        ("output", OUTPUT_DIR),
    ]:
        stats[name] = cleanup_old_files(directory)
    return stats


async def periodic_cleanup(interval: int = 300):
    """
    Background task that periodically cleans up temp files.
    Runs every `interval` seconds (default: 5 minutes).
    """
    while True:
        try:
            stats = cleanup_all_temp()
            total = sum(stats.values())
            if total > 0:
                print(f"[Cleanup] Removed {total} expired temp files: {stats}")
        except Exception as e:
            print(f"[Cleanup] Error: {e}")
        await asyncio.sleep(interval)


def get_file_size_str(size_bytes: int) -> str:
    """Convert file size in bytes to human-readable string."""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.2f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.2f} GB"
