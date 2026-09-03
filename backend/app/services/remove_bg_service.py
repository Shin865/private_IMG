"""
Remove Background Service — Uses rembg for AI-powered background removal.
Runs entirely locally using ONNX Runtime.
"""
from PIL import Image
from typing import Optional
import io
import logging

logger = logging.getLogger(__name__)

# Lazy-loaded session to avoid slow startup
_session = None


def _get_session():
    """Lazy-load rembg session (downloads model on first use)."""
    global _session
    if _session is None:
        try:
            from rembg import new_session
            _session = new_session("u2net")
            logger.info("rembg session loaded successfully (u2net model)")
        except Exception as e:
            logger.error(f"Failed to load rembg session: {e}")
            raise RuntimeError(
                "Background removal model not available. "
                "Make sure rembg is installed: pip install rembg[cpu]"
            ) from e
    return _session


def remove_background(
    img: Image.Image,
    model: str = "u2net",
    alpha_matting: bool = False,
    alpha_matting_foreground_threshold: int = 240,
    alpha_matting_background_threshold: int = 10,
    post_process_mask: bool = False,
) -> Image.Image:
    """
    Remove background from image using rembg.
    
    Args:
        img: Input PIL Image
        model: Model name (u2net, u2netp, u2net_human_seg, silueta, isnet-general-use)
        alpha_matting: Enable alpha matting for better edge quality
        alpha_matting_foreground_threshold: Foreground threshold for alpha matting
        alpha_matting_background_threshold: Background threshold for alpha matting
        post_process_mask: Apply post-processing to the mask
    
    Returns:
        PIL Image with transparent background (RGBA)
    """
    from rembg import remove

    session = _get_session()

    # Convert to bytes for rembg
    img_bytes = io.BytesIO()
    img.save(img_bytes, format="PNG")
    img_bytes.seek(0)

    result_bytes = remove(
        img_bytes.getvalue(),
        session=session,
        alpha_matting=alpha_matting,
        alpha_matting_foreground_threshold=alpha_matting_foreground_threshold,
        alpha_matting_background_threshold=alpha_matting_background_threshold,
        post_process_mask=post_process_mask,
    )

    result = Image.open(io.BytesIO(result_bytes)).convert("RGBA")
    return result


def remove_and_replace_background(
    img: Image.Image,
    background_color: str = "#FFFFFF",
    model: str = "u2net",
) -> Image.Image:
    """Remove background and replace with solid color."""
    # Remove background
    fg = remove_background(img, model=model)

    # Create background
    r, g, b = _parse_color(background_color)
    bg = Image.new("RGBA", fg.size, (r, g, b, 255))

    # Composite
    result = Image.alpha_composite(bg, fg)
    return result.convert("RGB")


def get_available_models() -> list:
    """Return list of available rembg models."""
    return [
        {"key": "u2net", "label": "U2-Net (General)", "desc": "Best for general objects"},
        {"key": "u2netp", "label": "U2-Net Lite", "desc": "Faster, less accurate"},
        {"key": "u2net_human_seg", "label": "U2-Net Human", "desc": "Optimized for people"},
        {"key": "silueta", "label": "Silueta", "desc": "Lightweight alternative"},
        {"key": "isnet-general-use", "label": "IS-Net", "desc": "High quality general use"},
    ]


def is_available() -> bool:
    """Check if rembg is available."""
    try:
        import rembg
        return True
    except ImportError:
        return False


def _parse_color(color: str):
    color = color.lstrip("#")
    if len(color) == 6:
        return int(color[0:2], 16), int(color[2:4], 16), int(color[4:6], 16)
    return 255, 255, 255
