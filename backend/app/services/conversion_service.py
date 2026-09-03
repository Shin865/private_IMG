"""
Conversion Service — Format conversion between image types.
"""
from PIL import Image
from typing import Optional

from app.services.image_service import prepare_for_format


# Format display info
FORMAT_INFO = {
    "JPEG": {"extensions": [".jpg", ".jpeg"], "supports_alpha": False, "supports_quality": True},
    "PNG": {"extensions": [".png"], "supports_alpha": True, "supports_quality": False},
    "WEBP": {"extensions": [".webp"], "supports_alpha": True, "supports_quality": True},
    "BMP": {"extensions": [".bmp"], "supports_alpha": False, "supports_quality": False},
    "TIFF": {"extensions": [".tiff", ".tif"], "supports_alpha": True, "supports_quality": False},
    "GIF": {"extensions": [".gif"], "supports_alpha": True, "supports_quality": False},
    "ICO": {"extensions": [".ico"], "supports_alpha": True, "supports_quality": False},
}


def convert_image(
    img: Image.Image,
    output_format: str,
    quality: int = 95,
) -> Image.Image:
    """
    Convert image to a different format.
    Handles color mode conversions automatically.
    """
    fmt = output_format.upper()
    if fmt == "JPG":
        fmt = "JPEG"

    if fmt not in FORMAT_INFO:
        raise ValueError(f"Unsupported format: {output_format}. Supported: {list(FORMAT_INFO.keys())}")

    return prepare_for_format(img, fmt)


def get_output_extension(output_format: str) -> str:
    """Get the file extension for a format."""
    fmt = output_format.upper()
    if fmt == "JPG":
        fmt = "JPEG"
    info = FORMAT_INFO.get(fmt)
    if info:
        return info["extensions"][0]
    return ".png"


def get_supported_formats() -> dict:
    """Return all supported formats with their info."""
    return FORMAT_INFO


def change_dpi(img: Image.Image, dpi_x: int, dpi_y: Optional[int] = None) -> Image.Image:
    """Change the DPI metadata of an image (does not resize)."""
    if dpi_y is None:
        dpi_y = dpi_x
    img.info["dpi"] = (dpi_x, dpi_y)
    return img
