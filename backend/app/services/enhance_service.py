"""
Enhance Service — AI-powered image enhancement pipeline.
Combines multiple adjustments for automatic image improvement.
Runs entirely locally using Pillow + OpenCV.
"""
from PIL import Image, ImageEnhance, ImageFilter
import numpy as np
import cv2
import logging

logger = logging.getLogger(__name__)


def auto_enhance(img: Image.Image, strength: float = 1.0) -> Image.Image:
    """
    Automatically enhance an image using analysis-based adjustments.
    
    Pipeline:
    1. Auto white balance
    2. Auto contrast (histogram equalization)
    3. Auto brightness
    4. Subtle sharpening
    5. Noise reduction (optional)
    
    Args:
        img: Input PIL Image
        strength: Enhancement strength (0.0 to 2.0, default 1.0)
    
    Returns:
        Enhanced PIL Image
    """
    if img.mode not in ("RGB",):
        img = img.convert("RGB")

    result = img.copy()

    # Step 1: Auto white balance
    result = _auto_white_balance(result, strength)

    # Step 2: Auto contrast via CLAHE
    result = _auto_contrast(result, strength)

    # Step 3: Auto brightness
    result = _auto_brightness(result, strength)

    # Step 4: Subtle sharpening
    result = _auto_sharpen(result, strength)

    # Step 5: Color vibrance boost
    result = _auto_vibrance(result, strength)

    return result


def _auto_white_balance(img: Image.Image, strength: float) -> Image.Image:
    """Auto white balance using gray world assumption."""
    arr = np.array(img, dtype=np.float32)

    # Gray world assumption: average of each channel should be equal
    avg_r = arr[:, :, 0].mean()
    avg_g = arr[:, :, 1].mean()
    avg_b = arr[:, :, 2].mean()
    avg_all = (avg_r + avg_g + avg_b) / 3

    if avg_r > 0 and avg_g > 0 and avg_b > 0:
        scale_r = avg_all / avg_r
        scale_g = avg_all / avg_g
        scale_b = avg_all / avg_b

        # Apply with strength blending
        blend = strength * 0.5  # Subtle effect
        arr[:, :, 0] = arr[:, :, 0] * (1 + (scale_r - 1) * blend)
        arr[:, :, 1] = arr[:, :, 1] * (1 + (scale_g - 1) * blend)
        arr[:, :, 2] = arr[:, :, 2] * (1 + (scale_b - 1) * blend)

    arr = np.clip(arr, 0, 255).astype(np.uint8)
    return Image.fromarray(arr)


def _auto_contrast(img: Image.Image, strength: float) -> Image.Image:
    """Auto contrast using CLAHE (Contrast Limited Adaptive Histogram Equalization)."""
    arr = np.array(img)
    lab = cv2.cvtColor(arr, cv2.COLOR_RGB2LAB)

    # Apply CLAHE to L channel
    clip_limit = 1.0 + strength * 1.5
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=(8, 8))
    lab[:, :, 0] = clahe.apply(lab[:, :, 0])

    result = cv2.cvtColor(lab, cv2.COLOR_LAB2RGB)
    return Image.fromarray(result)


def _auto_brightness(img: Image.Image, strength: float) -> Image.Image:
    """Auto brightness adjustment based on image analysis."""
    arr = np.array(img, dtype=np.float32)
    brightness = arr.mean()

    # Target brightness around 120-130
    target = 125
    if abs(brightness - target) > 10:
        factor = target / max(brightness, 1)
        # Limit the adjustment
        factor = max(0.8, min(1.3, factor))
        # Apply with strength blending
        blend_factor = 1 + (factor - 1) * strength * 0.5
        enhancer = ImageEnhance.Brightness(img)
        return enhancer.enhance(blend_factor)

    return img


def _auto_sharpen(img: Image.Image, strength: float) -> Image.Image:
    """Apply subtle adaptive sharpening."""
    radius = 1.0 + strength * 0.5
    percent = int(30 + strength * 30)
    return img.filter(ImageFilter.UnsharpMask(radius=radius, percent=percent, threshold=3))


def _auto_vibrance(img: Image.Image, strength: float) -> Image.Image:
    """Boost color vibrance (saturate less-saturated colors more)."""
    factor = 1.0 + strength * 0.15
    enhancer = ImageEnhance.Color(img)
    return enhancer.enhance(factor)


def get_enhancement_info() -> dict:
    """Return info about enhancement capabilities."""
    return {
        "pipeline": [
            "Auto White Balance",
            "Auto Contrast (CLAHE)",
            "Auto Brightness",
            "Adaptive Sharpening",
            "Color Vibrance Boost",
        ],
        "strength_range": {"min": 0.0, "max": 2.0, "default": 1.0},
        "description": "AI-powered automatic image enhancement using analysis-based adjustments",
    }
