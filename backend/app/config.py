"""
Local Image Tool — Configuration
"""
import os
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
TEMP_DIR = BASE_DIR / "temp"
UPLOAD_DIR = TEMP_DIR / "upload"
PROCESSING_DIR = TEMP_DIR / "processing"
OUTPUT_DIR = TEMP_DIR / "output"
MODELS_DIR = BASE_DIR / "models"

# Server
HOST = "0.0.0.0"
PORT = 8000
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# File limits
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
MAX_IMAGE_DIMENSION = 20000  # pixels
MAX_PIXEL_COUNT = 178_000_000  # ~178 megapixels (decompression bomb protection)

# Supported formats
ALLOWED_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".webp", ".bmp",
    ".tiff", ".tif", ".gif", ".ico"
}

SUPPORTED_INPUT_FORMATS = {
    "JPEG", "PNG", "WEBP", "BMP", "TIFF", "GIF", "ICO"
}

SUPPORTED_OUTPUT_FORMATS = {
    "JPEG": [".jpg", ".jpeg"],
    "PNG": [".png"],
    "WEBP": [".webp"],
    "BMP": [".bmp"],
    "TIFF": [".tiff", ".tif"],
    "GIF": [".gif"],
    "ICO": [".ico"],
}

# MIME type mapping
MIME_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".bmp": "image/bmp",
    ".tiff": "image/tiff",
    ".tif": "image/tiff",
    ".gif": "image/gif",
    ".ico": "image/x-icon",
}

# Temporary file settings
TEMP_FILE_TTL = 3600  # 1 hour in seconds

# Image magic bytes for validation
IMAGE_SIGNATURES = {
    b'\xff\xd8\xff': 'JPEG',
    b'\x89PNG\r\n\x1a\n': 'PNG',
    b'RIFF': 'WEBP',  # followed by size + WEBP
    b'BM': 'BMP',
    b'II\x2a\x00': 'TIFF',  # little-endian
    b'MM\x00\x2a': 'TIFF',  # big-endian
    b'GIF87a': 'GIF',
    b'GIF89a': 'GIF',
    b'\x00\x00\x01\x00': 'ICO',
}

# Resize presets
RESIZE_PRESETS = {
    "instagram_square": {"width": 1080, "height": 1080, "label": "Instagram Square"},
    "instagram_portrait": {"width": 1080, "height": 1350, "label": "Instagram Portrait"},
    "instagram_landscape": {"width": 1080, "height": 566, "label": "Instagram Landscape"},
    "facebook_post": {"width": 1200, "height": 630, "label": "Facebook Post"},
    "facebook_cover": {"width": 820, "height": 312, "label": "Facebook Cover"},
    "youtube_thumbnail": {"width": 1280, "height": 720, "label": "YouTube Thumbnail"},
    "youtube_banner": {"width": 2560, "height": 1440, "label": "YouTube Banner"},
    "whatsapp_dp": {"width": 800, "height": 800, "label": "WhatsApp DP"},
    "twitter_post": {"width": 1200, "height": 675, "label": "Twitter Post"},
    "thumbnail_small": {"width": 150, "height": 150, "label": "Thumbnail Small"},
    "thumbnail_medium": {"width": 300, "height": 300, "label": "Thumbnail Medium"},
    "passport": {"width": 413, "height": 531, "label": "Passport Photo"},
    "a4_72dpi": {"width": 595, "height": 842, "label": "A4 (72 DPI)"},
    "a4_150dpi": {"width": 1240, "height": 1754, "label": "A4 (150 DPI)"},
    "a4_300dpi": {"width": 2480, "height": 3508, "label": "A4 (300 DPI)"},
    "hd_720p": {"width": 1280, "height": 720, "label": "HD 720p"},
    "full_hd_1080p": {"width": 1920, "height": 1080, "label": "Full HD 1080p"},
    "4k": {"width": 3840, "height": 2160, "label": "4K UHD"},
}

# Compression presets
COMPRESSION_PRESETS = {
    "low": {"quality": 85, "label": "Low Compression"},
    "medium": {"quality": 60, "label": "Medium Compression"},
    "high": {"quality": 30, "label": "High Compression"},
}


def ensure_directories():
    """Create all necessary directories."""
    for directory in [TEMP_DIR, UPLOAD_DIR, PROCESSING_DIR, OUTPUT_DIR, MODELS_DIR]:
        directory.mkdir(parents=True, exist_ok=True)
