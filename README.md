# Local Image Tool

Aplikasi pengolahan gambar berbasis localhost yang sepenuhnya offline. Tidak ada gambar yang keluar dari komputer Anda.

## Features

- **Basic Tools**: Resize, Crop, Rotate, Flip
- **Compress**: Quality-based & target-size compression
- **Convert**: JPG ↔ PNG ↔ WebP ↔ BMP ↔ TIFF ↔ GIF ↔ ICO
- **Simple Editor**: Brightness, Contrast, Saturation, Filters
- **Watermark**: Text & image watermarks
- **Metadata**: View & remove EXIF data
- **Batch Processing**: Process 100+ images at once
- **AI Remove Background**: Using rembg (local)
- **AI Upscale**: Using Real-ESRGAN (local)
- **AI Enhance**: Denoise + Super Resolution + Sharpen

## Architecture

```
Browser (React/Vite) → REST API → FastAPI Backend
                                      ↓
                              Pillow / OpenCV / rembg / Real-ESRGAN
                                      ↓
                              Local Storage (temp/)
```

**No internet required. No cloud API. No API keys.**

## Setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Access

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend | FastAPI (Python) |
| Processing | Pillow, OpenCV |
| AI | rembg, Real-ESRGAN |
