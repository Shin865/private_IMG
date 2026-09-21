"""
Image Routes — Core image upload, info, and file serving endpoints.
"""
import io
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from fastapi.responses import FileResponse, StreamingResponse

from app.utils.file_validator import validate_file, ValidationError
from app.utils.temp_manager import (
    generate_file_id,
    get_upload_path,
    find_file_by_id,
    get_file_size_str,
)
from app.config import MIME_TYPES

router = APIRouter(prefix="/api/image", tags=["image"])


@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """
    Upload an image file with full validation.
    Returns file_id and image info.
    """
    try:
        # Read file content
        content = await file.read()
        
        # Validate
        img, info = validate_file(
            filename=file.filename or "unknown",
            file_content=content,
            content_type=file.content_type,
        )
        
        # Generate ID and save
        file_id = generate_file_id()
        ext = Path(file.filename).suffix.lower() if file.filename else ".png"
        upload_path = get_upload_path(file_id, ext)
        
        with open(upload_path, "wb") as f:
            f.write(content)
        
        # Get DPI if available
        dpi = img.info.get("dpi", (72, 72))
        if isinstance(dpi, tuple):
            dpi_x, dpi_y = int(dpi[0]), int(dpi[1])
        else:
            dpi_x = dpi_y = int(dpi)
        
        return {
            "success": True,
            "file_id": file_id,
            "filename": file.filename,
            "info": {
                "width": info["width"],
                "height": info["height"],
                "format": info.get("format", "Unknown"),
                "mode": info.get("mode", "Unknown"),
                "file_size": len(content),
                "file_size_str": get_file_size_str(len(content)),
                "dpi_x": dpi_x,
                "dpi_y": dpi_y,
                "extension": ext,
            }
        }
    
    except ValidationError as e:
        raise HTTPException(status_code=400, detail={
            "success": False,
            "error": e.message,
            "code": e.code,
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail={
            "success": False,
            "error": f"Internal error: {str(e)}",
            "code": "INTERNAL_ERROR",
        })


@router.get("/file/{file_id}")
async def get_image_file(file_id: str):
    """Serve a processed image file by ID."""
    file_path = find_file_by_id(file_id)
    if not file_path or not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    ext = file_path.suffix.lower()
    media_type = MIME_TYPES.get(ext, "application/octet-stream")
    
    return FileResponse(
        path=str(file_path),
        media_type=media_type,
        filename=file_path.name,
    )


@router.get("/thumbnail/{file_id}")
async def get_thumbnail(file_id: str, size: int = 300):
    """Generate and serve a thumbnail for preview."""
    from PIL import Image as PILImage
    
    file_path = find_file_by_id(file_id)
    if not file_path or not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        img = PILImage.open(file_path)
        img.thumbnail((size, size), PILImage.Resampling.LANCZOS)
        
        # Convert to RGB if necessary for JPEG output
        if img.mode in ('RGBA', 'LA', 'P'):
            # Keep as PNG for transparency
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            buf.seek(0)
            return StreamingResponse(buf, media_type="image/png")
        else:
            buf = io.BytesIO()
            img.save(buf, format="JPEG", quality=85)
            buf.seek(0)
            return StreamingResponse(buf, media_type="image/jpeg")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Thumbnail error: {str(e)}")


@router.post("/info")
async def get_image_info(file: UploadFile = File(...)):
    """Get detailed image information without saving."""
    from PIL import Image as PILImage
    from PIL.ExifTags import TAGS
    
    try:
        content = await file.read()
        img = PILImage.open(io.BytesIO(content))
        
        # Get DPI
        dpi = img.info.get("dpi", (72, 72))
        if isinstance(dpi, tuple):
            dpi_x, dpi_y = int(dpi[0]), int(dpi[1])
        else:
            dpi_x = dpi_y = int(dpi)
        
        # Get basic EXIF
        exif_data = {}
        try:
            raw_exif = img._getexif()
            if raw_exif:
                for tag_id, value in raw_exif.items():
                    tag = TAGS.get(tag_id, tag_id)
                    if isinstance(value, bytes):
                        value = value.decode("utf-8", errors="replace")
                    exif_data[str(tag)] = str(value)
        except (AttributeError, Exception):
            pass
        
        return {
            "success": True,
            "info": {
                "width": img.size[0],
                "height": img.size[1],
                "format": img.format or "Unknown",
                "mode": img.mode,
                "file_size": len(content),
                "file_size_str": get_file_size_str(len(content)),
                "dpi_x": dpi_x,
                "dpi_y": dpi_y,
                "has_alpha": img.mode in ('RGBA', 'LA', 'PA'),
                "is_animated": getattr(img, "is_animated", False),
                "n_frames": getattr(img, "n_frames", 1),
                "exif": exif_data,
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail={
            "success": False,
            "error": str(e),
        })


# ==================== Helper: process uploaded file ====================

async def _process_file(file: UploadFile):
    """Read and open uploaded file, return (PIL Image, content bytes, extension)."""
    content = await file.read()
    from PIL import Image as PILImage
    img = PILImage.open(io.BytesIO(content))
    img.load()
    ext = Path(file.filename).suffix.lower() if file.filename else ".png"
    return img, content, ext


def _build_response(file_id: str, img, file_size: int, ext: str):
    """Build standard process response."""
    from app.services.image_service import get_image_info
    info = get_image_info(img, file_size)
    info["extension"] = ext
    return {
        "success": True,
        "file_id": file_id,
        "info": info,
    }


# ==================== RESIZE ====================

@router.post("/resize")
async def resize_image_endpoint(
    file: UploadFile = File(...),
    width: Optional[int] = Form(None),
    height: Optional[int] = Form(None),
    maintain_aspect_ratio: bool = Form(True),
    algorithm: str = Form("lanczos"),
    preset: Optional[str] = Form(None),
):
    """Resize image with optional preset and algorithm."""
    from app.services.resize_service import resize_image
    from app.services.image_service import save_image as save_img

    try:
        img, content, ext = await _process_file(file)
        resized = resize_image(img, width, height, maintain_aspect_ratio, algorithm, preset)

        fmt = img.format or "PNG"
        file_id, path, file_size = save_img(resized, format=fmt, extension=ext)
        return _build_response(file_id, resized, file_size, ext)
    except Exception as e:
        raise HTTPException(status_code=400, detail={"success": False, "error": str(e)})


@router.get("/resize/presets")
async def get_resize_presets():
    """Get available resize presets."""
    from app.services.resize_service import get_presets
    return {"presets": get_presets()}


# ==================== CROP ====================

@router.post("/crop")
async def crop_image_endpoint(
    file: UploadFile = File(...),
    x: int = Form(0),
    y: int = Form(0),
    width: int = Form(...),
    height: int = Form(...),
):
    """Crop image by coordinates."""
    from app.services.crop_service import crop_image
    from app.services.image_service import save_image as save_img

    try:
        img, content, ext = await _process_file(file)
        cropped = crop_image(img, x, y, width, height)

        fmt = img.format or "PNG"
        file_id, path, file_size = save_img(cropped, format=fmt, extension=ext)
        return _build_response(file_id, cropped, file_size, ext)
    except Exception as e:
        raise HTTPException(status_code=400, detail={"success": False, "error": str(e)})


# ==================== ROTATE ====================

@router.post("/rotate")
async def rotate_image_endpoint(
    file: UploadFile = File(...),
    angle: float = Form(90),
):
    """Rotate image by angle (degrees, counter-clockwise)."""
    from PIL import Image as PILImage
    from app.services.image_service import save_image as save_img

    try:
        img, content, ext = await _process_file(file)

        # For exact 90/180/270, use transpose for speed
        angle_mod = angle % 360
        if angle_mod == 90:
            rotated = img.transpose(PILImage.Transpose.ROTATE_90)
        elif angle_mod == 180:
            rotated = img.transpose(PILImage.Transpose.ROTATE_180)
        elif angle_mod == 270:
            rotated = img.transpose(PILImage.Transpose.ROTATE_270)
        else:
            rotated = img.rotate(-angle, expand=True, resample=PILImage.Resampling.BICUBIC)

        fmt = img.format or "PNG"
        # Custom angles may create transparency, save as PNG
        if angle_mod not in (0, 90, 180, 270):
            fmt = "PNG"
            ext = ".png"

        file_id, path, file_size = save_img(rotated, format=fmt, extension=ext)
        return _build_response(file_id, rotated, file_size, ext)
    except Exception as e:
        raise HTTPException(status_code=400, detail={"success": False, "error": str(e)})


# ==================== FLIP ====================

@router.post("/flip")
async def flip_image_endpoint(
    file: UploadFile = File(...),
    direction: str = Form("horizontal"),
):
    """Flip image horizontally or vertically."""
    from PIL import Image as PILImage
    from app.services.image_service import save_image as save_img

    try:
        img, content, ext = await _process_file(file)

        if direction.lower() == "horizontal":
            flipped = img.transpose(PILImage.Transpose.FLIP_LEFT_RIGHT)
        elif direction.lower() == "vertical":
            flipped = img.transpose(PILImage.Transpose.FLIP_TOP_BOTTOM)
        else:
            raise ValueError(f"Invalid direction: {direction}. Use 'horizontal' or 'vertical'.")

        fmt = img.format or "PNG"
        file_id, path, file_size = save_img(flipped, format=fmt, extension=ext)
        return _build_response(file_id, flipped, file_size, ext)
    except Exception as e:
        raise HTTPException(status_code=400, detail={"success": False, "error": str(e)})


# ==================== COMPRESS ====================

@router.post("/compress")
async def compress_image_endpoint(
    file: UploadFile = File(...),
    quality: Optional[int] = Form(None),
    target_size_kb: Optional[int] = Form(None),
    preset: Optional[str] = Form(None),
    output_format: Optional[str] = Form(None),
):
    """Compress image by quality, target size, or preset."""
    from app.services.compression_service import compress_by_quality, compress_to_target_size, get_compression_preset
    from app.services.image_service import get_image_info
    from app.utils.temp_manager import get_output_path

    try:
        img, content, ext = await _process_file(file)
        fmt = output_format or img.format or "JPEG"
        if fmt.upper() == "JPG":
            fmt = "JPEG"

        # Determine quality
        if preset:
            q = get_compression_preset(preset)
        elif quality is not None:
            q = quality
        else:
            q = 85

        if target_size_kb:
            data, file_size, q_used = compress_to_target_size(img, target_size_kb, fmt)
        else:
            data, file_size = compress_by_quality(img, q, fmt)

        # Save to output
        file_id = generate_file_id()
        out_ext = ext if fmt.upper() == (img.format or "").upper() else f".{fmt.lower()}"
        if out_ext == ".jpeg":
            out_ext = ".jpg"
        out_path = get_output_path(file_id, out_ext)
        with open(out_path, "wb") as f:
            f.write(data)

        # Re-open to get info
        from PIL import Image as PILImage
        result_img = PILImage.open(io.BytesIO(data))
        info = get_image_info(result_img, file_size)
        info["extension"] = out_ext

        return {
            "success": True,
            "file_id": file_id,
            "info": info,
            "original_size": len(content),
            "compressed_size": file_size,
            "compression_ratio": round((1 - file_size / len(content)) * 100, 1) if len(content) > 0 else 0,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail={"success": False, "error": str(e)})


# ==================== CONVERT ====================

@router.post("/convert")
async def convert_image_endpoint(
    file: UploadFile = File(...),
    output_format: str = Form(...),
    quality: int = Form(95),
):
    """Convert image to a different format."""
    from app.services.conversion_service import convert_image, get_output_extension
    from app.services.image_service import save_image as save_img

    try:
        img, content, ext = await _process_file(file)
        converted = convert_image(img, output_format, quality)
        out_ext = get_output_extension(output_format)

        fmt = output_format.upper()
        if fmt == "JPG":
            fmt = "JPEG"
        file_id, path, file_size = save_img(converted, format=fmt, quality=quality, extension=out_ext)
        return _build_response(file_id, converted, file_size, out_ext)
    except Exception as e:
        raise HTTPException(status_code=400, detail={"success": False, "error": str(e)})


@router.get("/convert/formats")
async def get_conversion_formats():
    """Get supported conversion formats."""
    from app.services.conversion_service import get_supported_formats
    return {"formats": get_supported_formats()}


# ==================== CHANGE DPI ====================

@router.post("/change-dpi")
async def change_dpi_endpoint(
    file: UploadFile = File(...),
    dpi: int = Form(300),
):
    """Change image DPI metadata."""
    from app.services.image_service import save_image as save_img

    try:
        img, content, ext = await _process_file(file)
        img.info["dpi"] = (dpi, dpi)

        fmt = img.format or "PNG"
        file_id, path, file_size = save_img(img, format=fmt, extension=ext, dpi=(dpi, dpi))
        return _build_response(file_id, img, file_size, ext)
    except Exception as e:
        raise HTTPException(status_code=400, detail={"success": False, "error": str(e)})


# ==================== ADJUST ====================

@router.post("/adjust")
async def adjust_image_endpoint(
    file: UploadFile = File(...),
    brightness: float = Form(0),
    contrast: float = Form(0),
    saturation: float = Form(0),
    sharpness: float = Form(0),
    exposure: float = Form(0),
    temperature: float = Form(0),
    blur: float = Form(0),
    gamma: float = Form(1.0),
):
    """Apply adjustments to image."""
    from app.services.editor_service import apply_adjustments
    from app.services.image_service import save_image as save_img

    try:
        img, content, ext = await _process_file(file)
        adjustments = {
            "brightness": brightness,
            "contrast": contrast,
            "saturation": saturation,
            "sharpness": sharpness,
            "exposure": exposure,
            "temperature": temperature,
            "blur": blur,
            "gamma": gamma if gamma != 1.0 else 0,
        }
        adjusted = apply_adjustments(img, adjustments)

        fmt = img.format or "PNG"
        file_id, path, file_size = save_img(adjusted, format=fmt, extension=ext)
        return _build_response(file_id, adjusted, file_size, ext)
    except Exception as e:
        raise HTTPException(status_code=400, detail={"success": False, "error": str(e)})


# ==================== FILTER ====================

@router.post("/filter")
async def apply_filter_endpoint(
    file: UploadFile = File(...),
    filter_name: str = Form(...),
    strength: float = Form(100),
):
    """Apply a filter to image."""
    from app.services.editor_service import apply_filter
    from app.services.image_service import save_image as save_img

    try:
        img, content, ext = await _process_file(file)
        filtered = apply_filter(img, filter_name, strength)

        fmt = img.format or "PNG"
        file_id, path, file_size = save_img(filtered, format=fmt, extension=ext)
        return _build_response(file_id, filtered, file_size, ext)
    except Exception as e:
        raise HTTPException(status_code=400, detail={"success": False, "error": str(e)})


@router.get("/filter/list")
async def list_filters():
    """Get available filters."""
    from app.services.editor_service import get_available_filters
    return {"filters": get_available_filters()}


# ==================== WATERMARK ====================

@router.post("/watermark")
async def add_watermark_endpoint(
    file: UploadFile = File(...),
    text: str = Form("SAMPLE"),
    position: str = Form("center"),
    opacity: int = Form(30),
    rotation: int = Form(0),
    font_size: int = Form(48),
    color: str = Form("#FFFFFF"),
    tiled: bool = Form(False),
):
    """Add text watermark to image."""
    from app.services.watermark_service import add_text_watermark
    from app.services.image_service import save_image as save_img

    try:
        img, content, ext = await _process_file(file)
        result = add_text_watermark(
            img, text=text, position=position, opacity=opacity,
            rotation=rotation, font_size=font_size, color=color, tiled=tiled
        )

        fmt = img.format or "PNG"
        file_id, path, file_size = save_img(result, format=fmt, extension=ext)
        return _build_response(file_id, result, file_size, ext)
    except Exception as e:
        raise HTTPException(status_code=400, detail={"success": False, "error": str(e)})


# ==================== BORDER ====================

@router.post("/border")
async def add_border_endpoint(
    file: UploadFile = File(...),
    top: int = Form(20),
    bottom: int = Form(20),
    left: int = Form(20),
    right: int = Form(20),
    color: str = Form("#FFFFFF"),
):
    """Add border around image."""
    from app.services.border_service import add_border
    from app.services.image_service import save_image as save_img

    try:
        img, content, ext = await _process_file(file)
        result = add_border(img, top=top, bottom=bottom, left=left, right=right, color=color)

        fmt = img.format or "PNG"
        file_id, path, file_size = save_img(result, format=fmt, extension=ext)
        return _build_response(file_id, result, file_size, ext)
    except Exception as e:
        raise HTTPException(status_code=400, detail={"success": False, "error": str(e)})


@router.post("/canvas-resize")
async def canvas_resize_endpoint(
    file: UploadFile = File(...),
    canvas_width: int = Form(...),
    canvas_height: int = Form(...),
    position: str = Form("center"),
    color: str = Form("#FFFFFF"),
):
    """Resize canvas and position image."""
    from app.services.border_service import canvas_resize
    from app.services.image_service import save_image as save_img

    try:
        img, content, ext = await _process_file(file)
        result = canvas_resize(img, canvas_width, canvas_height, position, color)

        fmt = img.format or "PNG"
        file_id, path, file_size = save_img(result, format=fmt, extension=ext)
        return _build_response(file_id, result, file_size, ext)
    except Exception as e:
        raise HTTPException(status_code=400, detail={"success": False, "error": str(e)})


# ==================== METADATA ====================

@router.post("/metadata/remove")
async def remove_metadata_endpoint(
    file: UploadFile = File(...),
    remove_exif: bool = Form(True),
):
    """Remove EXIF/metadata from image."""
    from app.services.image_service import save_image as save_img
    from PIL import Image as PILImage

    try:
        img, content, ext = await _process_file(file)

        # Create clean copy without metadata
        clean = PILImage.new(img.mode, img.size)
        clean.putdata(list(img.getdata()))

        fmt = img.format or "PNG"
        file_id, path, file_size = save_img(clean, format=fmt, extension=ext)
        return _build_response(file_id, clean, file_size, ext)
    except Exception as e:
        raise HTTPException(status_code=400, detail={"success": False, "error": str(e)})


# ==================== BATCH ====================

@router.post("/batch/start")
async def start_batch_endpoint(
    files: list[UploadFile] = File(...),
    operation: str = Form("resize"),
    width: Optional[int] = Form(None),
    height: Optional[int] = Form(None),
    output_format: Optional[str] = Form(None),
    quality: int = Form(85),
):
    """Start batch processing job."""
    import asyncio
    from app.services.batch_service import create_job, process_batch

    try:
        operations = {}
        if operation in ("resize", "all") and (width or height):
            operations["resize"] = {"width": width, "height": height}
        if operation in ("convert", "all") and output_format:
            operations["convert"] = {"format": output_format}
        if operation in ("compress", "all"):
            operations["compress"] = {"quality": quality}

        # Read all files
        file_data = []
        for f in files:
            content = await f.read()
            file_data.append((f.filename or "unknown.png", content))

        job_id = create_job(len(file_data), operations)

        # Run processing in background
        asyncio.create_task(process_batch(job_id, file_data, operations))

        return {
            "success": True,
            "job_id": job_id,
            "total_files": len(file_data),
            "operations": operations,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail={"success": False, "error": str(e)})


@router.get("/batch/status/{job_id}")
async def batch_status_endpoint(job_id: str):
    """Get batch job status."""
    from app.services.batch_service import get_job

    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "success": True,
        "job_id": job["id"],
        "status": job["status"],
        "total": job["total"],
        "completed": job["completed"],
        "failed": job["failed"],
        "current_file": job["current_file"],
        "results": job.get("results", []),
        "errors": job.get("errors", []),
        "zip_id": job.get("zip_id"),
    }


# ==================== AI: REMOVE BACKGROUND ====================

@router.post("/remove-background")
async def remove_background_endpoint(
    file: UploadFile = File(...),
    model: str = Form("isnet-general-use"),
    background_type: str = Form("transparent"),
    background_color: str = Form("#FFFFFF"),
    alpha_matting: bool = Form(False),
):
    """Remove background from image using AI (rembg)."""
    from app.services.image_service import save_image as save_img

    try:
        img, content, ext = await _process_file(file)

        if background_type == "transparent":
            from app.services.remove_bg_service import remove_background
            result = remove_background(img, model=model, alpha_matting=alpha_matting)
            # Save as PNG to preserve transparency
            file_id, path, file_size = save_img(result, format="PNG", extension=".png")
            return _build_response(file_id, result, file_size, ".png")
        else:
            from app.services.remove_bg_service import remove_and_replace_background
            result = remove_and_replace_background(img, background_color=background_color, model=model)
            fmt = img.format or "PNG"
            file_id, path, file_size = save_img(result, format=fmt, extension=ext)
            return _build_response(file_id, result, file_size, ext)
    except Exception as e:
        raise HTTPException(status_code=400, detail={"success": False, "error": str(e)})


@router.get("/remove-background/status")
async def remove_bg_status():
    """Check if background removal is available."""
    from app.services.remove_bg_service import is_available, get_available_models
    return {
        "available": is_available(),
        "models": get_available_models(),
    }


# ==================== AI: UPSCALE ====================

@router.post("/upscale")
async def upscale_endpoint(
    file: UploadFile = File(...),
    scale: int = Form(2),
    method: str = Form("lanczos"),
    sharpen: bool = Form(True),
    denoise: bool = Form(False),
):
    """Upscale image resolution."""
    from app.services.upscale_service import upscale_image
    from app.services.image_service import save_image as save_img

    try:
        img, content, ext = await _process_file(file)
        result = upscale_image(img, scale=scale, method=method, sharpen=sharpen, denoise=denoise)

        fmt = img.format or "PNG"
        file_id, path, file_size = save_img(result, format=fmt, extension=ext)
        return _build_response(file_id, result, file_size, ext)
    except Exception as e:
        raise HTTPException(status_code=400, detail={"success": False, "error": str(e)})


@router.get("/upscale/methods")
async def upscale_methods():
    """Get available upscale methods."""
    from app.services.upscale_service import get_available_methods
    return {"methods": get_available_methods()}


# ==================== AI: ENHANCE ====================

@router.post("/enhance")
async def enhance_endpoint(
    file: UploadFile = File(...),
    strength: float = Form(1.0),
):
    """Auto-enhance image using AI pipeline."""
    from app.services.enhance_service import auto_enhance
    from app.services.image_service import save_image as save_img

    try:
        img, content, ext = await _process_file(file)
        result = auto_enhance(img, strength=strength)

        fmt = img.format or "PNG"
        file_id, path, file_size = save_img(result, format=fmt, extension=ext)
        return _build_response(file_id, result, file_size, ext)
    except Exception as e:
        raise HTTPException(status_code=400, detail={"success": False, "error": str(e)})


@router.get("/enhance/info")
async def enhance_info():
    """Get enhancement pipeline info."""
    from app.services.enhance_service import get_enhancement_info
    return get_enhancement_info()
