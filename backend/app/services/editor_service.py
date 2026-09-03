"""
Editor Service — Image adjustments and filters.
"""
import io
from PIL import Image, ImageEnhance, ImageFilter
import numpy as np
import cv2


# ==================== ADJUSTMENTS ====================

def adjust_brightness(img: Image.Image, value: float) -> Image.Image:
    """Adjust brightness. value: -100 to 100 (0 = no change)."""
    factor = 1 + (value / 100)
    return ImageEnhance.Brightness(img).enhance(max(0, factor))


def adjust_contrast(img: Image.Image, value: float) -> Image.Image:
    """Adjust contrast. value: -100 to 100 (0 = no change)."""
    factor = 1 + (value / 100)
    return ImageEnhance.Contrast(img).enhance(max(0, factor))


def adjust_saturation(img: Image.Image, value: float) -> Image.Image:
    """Adjust saturation. value: -100 to 100 (0 = no change)."""
    factor = 1 + (value / 100)
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGB")
    return ImageEnhance.Color(img).enhance(max(0, factor))


def adjust_sharpness(img: Image.Image, value: float) -> Image.Image:
    """Adjust sharpness. value: -100 to 100 (0 = no change)."""
    factor = 1 + (value / 100)
    return ImageEnhance.Sharpness(img).enhance(max(0, factor))


def adjust_exposure(img: Image.Image, value: float) -> Image.Image:
    """Adjust exposure via gamma. value: -100 to 100."""
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGB")
    arr = np.array(img, dtype=np.float32) / 255.0
    gamma = 1.0 / max(0.1, 1 + (value / 100))
    arr = np.power(arr, gamma)
    arr = np.clip(arr * 255, 0, 255).astype(np.uint8)
    return Image.fromarray(arr, mode=img.mode)


def adjust_temperature(img: Image.Image, value: float) -> Image.Image:
    """Adjust color temperature. value: -100 (cool) to 100 (warm)."""
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGB")
    arr = np.array(img, dtype=np.float32)
    # Warm = more red/yellow, Cool = more blue
    shift = value / 100 * 30
    arr[:, :, 0] = np.clip(arr[:, :, 0] + shift, 0, 255)  # Red
    arr[:, :, 2] = np.clip(arr[:, :, 2] - shift, 0, 255)  # Blue
    return Image.fromarray(arr.astype(np.uint8), mode=img.mode)


def adjust_blur(img: Image.Image, value: float) -> Image.Image:
    """Apply Gaussian blur. value: 0 to 100."""
    if value <= 0:
        return img
    radius = max(0.5, value / 10)
    return img.filter(ImageFilter.GaussianBlur(radius=radius))


def adjust_gamma(img: Image.Image, value: float) -> Image.Image:
    """Adjust gamma. value: 0.1 to 3.0 (1.0 = no change)."""
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGB")
    arr = np.array(img, dtype=np.float32) / 255.0
    arr = np.power(arr, 1.0 / max(0.1, value))
    arr = np.clip(arr * 255, 0, 255).astype(np.uint8)
    return Image.fromarray(arr, mode=img.mode)


def apply_adjustments(img: Image.Image, adjustments: dict) -> Image.Image:
    """Apply multiple adjustments in sequence."""
    result = img.copy()
    # Convert palette/grayscale modes to RGB for processing
    if result.mode not in ("RGB", "RGBA"):
        result = result.convert("RGB")
    adj_map = {
        "brightness": adjust_brightness,
        "contrast": adjust_contrast,
        "saturation": adjust_saturation,
        "sharpness": adjust_sharpness,
        "exposure": adjust_exposure,
        "temperature": adjust_temperature,
        "blur": adjust_blur,
        "gamma": adjust_gamma,
    }
    for key, value in adjustments.items():
        if key in adj_map and value != 0:
            result = adj_map[key](result, value)
    return result


# ==================== FILTERS ====================

def filter_grayscale(img: Image.Image) -> Image.Image:
    """Convert to grayscale."""
    return img.convert("L").convert("RGB")


def filter_sepia(img: Image.Image) -> Image.Image:
    """Apply sepia tone."""
    if img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGB")
    arr = np.array(img, dtype=np.float32)
    sepia_matrix = np.array([
        [0.393, 0.769, 0.189],
        [0.349, 0.686, 0.168],
        [0.272, 0.534, 0.131],
    ])
    result = arr[:, :, :3] @ sepia_matrix.T
    result = np.clip(result, 0, 255).astype(np.uint8)
    if img.mode == "RGBA":
        alpha = np.array(img)[:, :, 3:]
        result = np.concatenate([result, alpha], axis=2)
        return Image.fromarray(result, mode="RGBA")
    return Image.fromarray(result, mode="RGB")


def filter_vintage(img: Image.Image) -> Image.Image:
    """Apply vintage/retro filter."""
    result = filter_sepia(img)
    result = adjust_contrast(result, -15)
    result = adjust_brightness(result, 10)
    result = adjust_saturation(result, -20)
    return result


def filter_bw(img: Image.Image) -> Image.Image:
    """High-contrast black & white."""
    gray = img.convert("L")
    enhanced = ImageEnhance.Contrast(gray).enhance(1.5)
    return enhanced.convert("RGB")


def filter_blur(img: Image.Image, strength: float = 50) -> Image.Image:
    """Apply blur filter."""
    radius = max(1, strength / 10)
    return img.filter(ImageFilter.GaussianBlur(radius=radius))


def filter_sharpen(img: Image.Image) -> Image.Image:
    """Sharpen filter."""
    return img.filter(ImageFilter.SHARPEN)


def filter_emboss(img: Image.Image) -> Image.Image:
    """Emboss filter."""
    return img.filter(ImageFilter.EMBOSS)


def filter_edge_detection(img: Image.Image) -> Image.Image:
    """Edge detection filter using OpenCV Canny."""
    if img.mode not in ("RGB",):
        img = img.convert("RGB")
    arr = np.array(img)
    gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    edges_rgb = cv2.cvtColor(edges, cv2.COLOR_GRAY2RGB)
    return Image.fromarray(edges_rgb)


FILTERS = {
    "grayscale": filter_grayscale,
    "sepia": filter_sepia,
    "vintage": filter_vintage,
    "bw": filter_bw,
    "blur": filter_blur,
    "sharpen": filter_sharpen,
    "emboss": filter_emboss,
    "edge_detection": filter_edge_detection,
}


def apply_filter(img: Image.Image, filter_name: str, strength: float = 100) -> Image.Image:
    """Apply a named filter."""
    if filter_name not in FILTERS:
        raise ValueError(f"Unknown filter: {filter_name}. Available: {list(FILTERS.keys())}")

    fn = FILTERS[filter_name]
    if filter_name == "blur":
        return fn(img, strength)
    return fn(img)


def get_available_filters() -> list:
    """Return list of available filter names."""
    return list(FILTERS.keys())
