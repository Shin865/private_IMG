"""
File Validator — Validates uploaded files before processing.

Checks:
1. File extension
2. MIME type
3. Magic bytes (image signature)
4. Image dimensions (decompression bomb protection)
5. Pillow validation (actually opens the image)
"""
import io
import os
from pathlib import Path
from typing import Optional, Tuple

from PIL import Image

from app.config import (
    ALLOWED_EXTENSIONS,
    IMAGE_SIGNATURES,
    MAX_FILE_SIZE,
    MAX_IMAGE_DIMENSION,
    MAX_PIXEL_COUNT,
    MIME_TYPES,
)


class ValidationError(Exception):
    """Custom exception for validation errors."""
    def __init__(self, message: str, code: str = "VALIDATION_ERROR"):
        self.message = message
        self.code = code
        super().__init__(self.message)


def validate_extension(filename: str) -> str:
    """
    Validate file extension.
    Returns the lowercase extension if valid.
    Raises ValidationError if invalid.
    """
    ext = Path(filename).suffix.lower()
    if not ext:
        raise ValidationError(
            "File has no extension.",
            "NO_EXTENSION"
        )
    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationError(
            f"Unsupported file format: {ext}. "
            f"Supported: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
            "UNSUPPORTED_FORMAT"
        )
    return ext


def validate_file_size(file_size: int) -> None:
    """Validate file size against maximum limit."""
    if file_size > MAX_FILE_SIZE:
        max_mb = MAX_FILE_SIZE / (1024 * 1024)
        file_mb = file_size / (1024 * 1024)
        raise ValidationError(
            f"File too large: {file_mb:.1f}MB. Maximum: {max_mb:.0f}MB.",
            "FILE_TOO_LARGE"
        )


def validate_mime_type(ext: str, content_type: Optional[str]) -> None:
    """Validate MIME type matches expected type for the extension."""
    if content_type is None:
        return  # Skip if no content type provided
    
    expected_mime = MIME_TYPES.get(ext)
    if expected_mime and content_type != expected_mime:
        # Some browsers send different MIME types, be lenient
        # but still check for obviously wrong types
        if not content_type.startswith("image/"):
            raise ValidationError(
                f"Invalid MIME type: {content_type}. Expected an image type.",
                "INVALID_MIME"
            )


def validate_magic_bytes(file_content: bytes) -> str:
    """
    Validate file by checking magic bytes (file signature).
    Returns the detected format if valid.
    Raises ValidationError if format not recognized.
    """
    for signature, format_name in IMAGE_SIGNATURES.items():
        if file_content[:len(signature)] == signature:
            # Special check for WEBP: must have 'WEBP' at offset 8
            if signature == b'RIFF' and file_content[8:12] != b'WEBP':
                continue
            return format_name
    
    raise ValidationError(
        "File does not appear to be a valid image (magic bytes check failed).",
        "INVALID_SIGNATURE"
    )


def validate_image_dimensions(img: Image.Image) -> None:
    """
    Validate image dimensions to prevent decompression bombs
    and memory issues.
    """
    width, height = img.size
    
    if width > MAX_IMAGE_DIMENSION or height > MAX_IMAGE_DIMENSION:
        raise ValidationError(
            f"Image dimensions too large: {width}×{height}. "
            f"Maximum: {MAX_IMAGE_DIMENSION}×{MAX_IMAGE_DIMENSION}.",
            "DIMENSIONS_TOO_LARGE"
        )
    
    pixel_count = width * height
    if pixel_count > MAX_PIXEL_COUNT:
        raise ValidationError(
            f"Image has too many pixels: {pixel_count:,}. "
            f"Maximum: {MAX_PIXEL_COUNT:,} pixels.",
            "TOO_MANY_PIXELS"
        )


def validate_with_pillow(file_content: bytes) -> Tuple[Image.Image, dict]:
    """
    Open and validate image with Pillow.
    Returns (PIL Image, info dict) if valid.
    Raises ValidationError if image cannot be opened.
    """
    try:
        img = Image.open(io.BytesIO(file_content))
        img.verify()  # Verify it's a valid image
        
        # Re-open after verify (verify() can close the image)
        img = Image.open(io.BytesIO(file_content))
        img.load()  # Force full load to catch truncated images
        
        info = {
            "width": img.size[0],
            "height": img.size[1],
            "format": img.format,
            "mode": img.mode,
        }
        
        return img, info
        
    except Exception as e:
        raise ValidationError(
            f"Failed to open image: {str(e)}",
            "INVALID_IMAGE"
        )


def validate_file(
    filename: str,
    file_content: bytes,
    content_type: Optional[str] = None
) -> Tuple[Image.Image, dict]:
    """
    Full validation pipeline:
    1. Extension check
    2. File size check
    3. MIME type check
    4. Magic bytes check
    5. Pillow validation
    6. Dimension check
    
    Returns (PIL Image, info dict) if all checks pass.
    Raises ValidationError on any failure.
    """
    # 1. Extension
    ext = validate_extension(filename)
    
    # 2. File size
    validate_file_size(len(file_content))
    
    # 3. MIME type
    validate_mime_type(ext, content_type)
    
    # 4. Magic bytes
    detected_format = validate_magic_bytes(file_content)
    
    # 5. Pillow validation
    img, info = validate_with_pillow(file_content)
    info["detected_format"] = detected_format
    
    # 6. Dimension check
    validate_image_dimensions(img)
    
    return img, info
