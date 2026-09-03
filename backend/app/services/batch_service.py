"""
Batch Service — Process multiple images with queued operations.
"""
import io
import uuid
import zipfile
import asyncio
from pathlib import Path
from typing import Optional, List, Dict
from PIL import Image

from app.config import OUTPUT_DIR
from app.utils.temp_manager import generate_file_id, get_output_path, get_file_size_str
from app.services.image_service import save_image, read_image_from_bytes, prepare_for_format
from app.services.resize_service import resize_image
from app.services.compression_service import compress_by_quality
from app.services.conversion_service import convert_image, get_output_extension


# In-memory job store
_jobs: Dict[str, dict] = {}


def create_job(file_count: int, operations: dict) -> str:
    """Create a new batch job."""
    job_id = str(uuid.uuid4())
    _jobs[job_id] = {
        "id": job_id,
        "status": "pending",
        "total": file_count,
        "completed": 0,
        "failed": 0,
        "current_file": "",
        "operations": operations,
        "results": [],
        "errors": [],
        "zip_path": None,
    }
    return job_id


def get_job(job_id: str) -> Optional[dict]:
    """Get job status."""
    return _jobs.get(job_id)


def cancel_job(job_id: str) -> bool:
    """Cancel a job."""
    job = _jobs.get(job_id)
    if job:
        job["status"] = "cancelled"
        return True
    return False


async def process_batch(
    job_id: str,
    files: List[tuple],  # List of (filename, content_bytes)
    operations: dict,
) -> None:
    """Process batch job asynchronously."""
    job = _jobs.get(job_id)
    if not job:
        return

    job["status"] = "processing"
    results = []

    for i, (filename, content) in enumerate(files):
        if job["status"] == "cancelled":
            break

        job["current_file"] = filename

        try:
            img = read_image_from_bytes(content)
            ext = Path(filename).suffix.lower()
            fmt = img.format or "PNG"

            # Apply operations in order
            if operations.get("resize"):
                w = operations["resize"].get("width")
                h = operations["resize"].get("height")
                if w or h:
                    img = resize_image(img, width=w, height=h, maintain_aspect_ratio=True)

            if operations.get("convert"):
                target_fmt = operations["convert"].get("format", "JPEG")
                img = prepare_for_format(img, target_fmt)
                fmt = target_fmt
                ext = get_output_extension(target_fmt)

            if operations.get("compress"):
                quality = operations["compress"].get("quality", 80)
            else:
                quality = 95

            file_id, path, file_size = save_image(img, format=fmt, quality=quality, extension=ext)
            results.append({
                "filename": filename,
                "file_id": file_id,
                "file_size": file_size,
                "file_size_str": get_file_size_str(file_size),
                "path": str(path),
            })
            job["completed"] += 1

        except Exception as e:
            job["failed"] += 1
            job["errors"].append({"filename": filename, "error": str(e)})

        # Small delay to prevent blocking
        await asyncio.sleep(0.01)

    # Create ZIP of results
    if results and job["status"] != "cancelled":
        zip_id = generate_file_id()
        zip_path = get_output_path(zip_id, ".zip")
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for r in results:
                file_path = Path(r["path"])
                if file_path.exists():
                    arcname = f"batch_output/{r['filename']}"
                    # Change extension if converted
                    if operations.get("convert"):
                        base = Path(r["filename"]).stem
                        new_ext = get_output_extension(operations["convert"].get("format", "JPEG"))
                        arcname = f"batch_output/{base}{new_ext}"
                    zf.write(file_path, arcname)

        job["zip_path"] = str(zip_path)
        job["zip_id"] = zip_id

    job["results"] = results
    job["status"] = "completed" if job["status"] != "cancelled" else "cancelled"
    job["current_file"] = ""
