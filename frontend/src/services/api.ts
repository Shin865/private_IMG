import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 300000, // 5 min timeout for AI operations
});

// Types
export interface ImageInfo {
  width: number;
  height: number;
  format: string;
  mode: string;
  file_size: number;
  file_size_str: string;
  dpi_x: number;
  dpi_y: number;
  extension: string;
  has_alpha?: boolean;
  is_animated?: boolean;
  n_frames?: number;
  exif?: Record<string, string>;
}

export interface UploadResponse {
  success: boolean;
  file_id: string;
  filename: string;
  info: ImageInfo;
}

export interface ProcessResponse {
  success: boolean;
  file_id: string;
  info: ImageInfo;
  original_info?: ImageInfo;
}

// Helper: create FormData with image
function createImageFormData(file: File, params?: Record<string, string | number | boolean>): FormData {
  const formData = new FormData();
  formData.append('file', file);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
  }
  return formData;
}


// ==================== API Functions ====================

// Health check
export async function healthCheck(): Promise<{ status: string }> {
  const res = await api.get('/health');
  return res.data;
}

// Upload image
export async function uploadImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResponse> {
  const formData = createImageFormData(file);
  const res = await api.post('/image/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e: any) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total));
      }
    },
  });
  return res.data;
}

// Get image info
export async function getImageInfo(file: File): Promise<{ info: ImageInfo }> {
  const formData = createImageFormData(file);
  const res = await api.post('/image/info', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

// Get image URL
export function getImageUrl(fileId: string): string {
  return `${API_BASE}/image/file/${fileId}`;
}

// Get thumbnail URL
export function getThumbnailUrl(fileId: string, size: number = 300): string {
  return `${API_BASE}/image/thumbnail/${fileId}?size=${size}`;
}

// Download image
export async function downloadImage(fileId: string, filename: string): Promise<void> {
  const res = await api.get(`/image/file/${fileId}`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// Resize
export async function resizeImage(
  file: File,
  params: {
    width?: number;
    height?: number;
    maintain_aspect_ratio?: boolean;
    algorithm?: string;
    preset?: string;
  }
): Promise<ProcessResponse> {
  const formData = createImageFormData(file, params as Record<string, string | number | boolean>);
  const res = await api.post('/image/resize', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

// Crop
export async function cropImage(
  file: File,
  params: {
    x: number;
    y: number;
    width: number;
    height: number;
  }
): Promise<ProcessResponse> {
  const formData = createImageFormData(file, params as Record<string, string | number | boolean>);
  const res = await api.post('/image/crop', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

// Rotate
export async function rotateImage(
  file: File,
  params: { angle: number }
): Promise<ProcessResponse> {
  const formData = createImageFormData(file, params as Record<string, string | number | boolean>);
  const res = await api.post('/image/rotate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

// Flip
export async function flipImage(
  file: File,
  params: { direction: 'horizontal' | 'vertical' }
): Promise<ProcessResponse> {
  const formData = createImageFormData(file, params as Record<string, string | number | boolean>);
  const res = await api.post('/image/flip', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

// Compress
export async function compressImage(
  file: File,
  params: {
    quality?: number;
    target_size_kb?: number;
    format?: string;
  }
): Promise<ProcessResponse> {
  const formData = createImageFormData(file, params as Record<string, string | number | boolean>);
  const res = await api.post('/image/compress', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

// Convert
export async function convertImage(
  file: File,
  params: {
    output_format: string;
    quality?: number;
  }
): Promise<ProcessResponse> {
  const formData = createImageFormData(file, params as Record<string, string | number | boolean>);
  const res = await api.post('/image/convert', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

// Adjust
export async function adjustImage(
  file: File,
  params: Record<string, number>
): Promise<ProcessResponse> {
  const formData = createImageFormData(file, params as Record<string, string | number | boolean>);
  const res = await api.post('/image/adjust', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

// Filter
export async function applyFilter(
  file: File,
  params: { filter_name: string; strength?: number }
): Promise<ProcessResponse> {
  const formData = createImageFormData(file, params as Record<string, string | number | boolean>);
  const res = await api.post('/image/filter', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

// Watermark
export async function addWatermark(
  file: File,
  params: Record<string, string | number | boolean>
): Promise<ProcessResponse> {
  const formData = createImageFormData(file, params);
  const res = await api.post('/image/watermark', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

// Metadata
export async function getMetadata(file: File): Promise<{ info: ImageInfo }> {
  const formData = createImageFormData(file);
  const res = await api.post('/image/info', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function removeMetadata(
  file: File,
  params: Record<string, boolean>
): Promise<ProcessResponse> {
  const formData = createImageFormData(file, params as Record<string, string | number | boolean>);
  const res = await api.post('/image/metadata/remove', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

// Remove Background (AI)
export async function removeBackground(
  file: File,
  params?: {
    model?: string;
    background_type?: string;
    background_color?: string;
  }
): Promise<ProcessResponse> {
  const formData = createImageFormData(file, params as Record<string, string | number | boolean>);
  const res = await api.post('/image/remove-background', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });
  return res.data;
}

// Upscale (AI)
export async function upscaleImage(
  file: File,
  params?: {
    scale?: number;
    model?: string;
    face_enhance?: boolean;
  }
): Promise<ProcessResponse> {
  const formData = createImageFormData(file, params as Record<string, string | number | boolean>);
  const res = await api.post('/image/upscale', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 180000,
  });
  return res.data;
}

// Enhance (AI)
export async function enhanceImage(file: File): Promise<ProcessResponse> {
  const formData = createImageFormData(file);
  const res = await api.post('/image/enhance', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 180000,
  });
  return res.data;
}

export default api;
