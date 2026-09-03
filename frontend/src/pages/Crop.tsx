import { useState, useRef, useCallback, useEffect } from 'react';
import ToolPageWrapper from '../components/ToolPageWrapper';
import { cropImage, getImageUrl } from '../services/api';

const ASPECT_RATIOS = [
  { key: 'free', label: 'Free' },
  { key: '1:1', label: '1:1', w: 1, h: 1 },
  { key: '4:3', label: '4:3', w: 4, h: 3 },
  { key: '3:4', label: '3:4', w: 3, h: 4 },
  { key: '16:9', label: '16:9', w: 16, h: 9 },
  { key: '9:16', label: '9:16', w: 9, h: 16 },
  { key: '3:2', label: '3:2', w: 3, h: 2 },
  { key: '2:3', label: '2:3', w: 2, h: 3 },
];

export default function Crop() {
  return (
    <ToolPageWrapper title="Crop Image" subtitle="Crop images with custom or preset aspect ratios">
      {({ file, fileId, info, setResult, processing, setProcessing, setError }) => {
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const containerRef = useRef<HTMLDivElement>(null);
        const [ratio, setRatio] = useState('free');
        const [cropX, setCropX] = useState(0);
        const [cropY, setCropY] = useState(0);
        const [cropW, setCropW] = useState(info.width);
        const [cropH, setCropH] = useState(info.height);
        const [dragging, setDragging] = useState(false);
        const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
        const [imageLoaded, setImageLoaded] = useState(false);
        const [scale, setScale] = useState(1);
        const imgRef = useRef<HTMLImageElement | null>(null);

        // Load image and draw canvas
        useEffect(() => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            imgRef.current = img;
            setImageLoaded(true);
            drawCanvas(img, cropX, cropY, cropW, cropH);
          };
          img.src = getImageUrl(fileId);
        }, [fileId]);

        // Redraw when crop changes
        useEffect(() => {
          if (imgRef.current && imageLoaded) {
            drawCanvas(imgRef.current, cropX, cropY, cropW, cropH);
          }
        }, [cropX, cropY, cropW, cropH, imageLoaded]);

        const drawCanvas = (img: HTMLImageElement, cx: number, cy: number, cw: number, ch: number) => {
          const canvas = canvasRef.current;
          const container = containerRef.current;
          if (!canvas || !container) return;

          const maxW = container.clientWidth;
          const maxH = 400;
          const s = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
          setScale(s);

          canvas.width = img.naturalWidth * s;
          canvas.height = img.naturalHeight * s;

          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          // Draw image dimmed
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw crop area (clear)
          const sx = cx * s, sy = cy * s, sw = cw * s, sh = ch * s;
          ctx.drawImage(
            img,
            cx, cy, cw, ch,
            sx, sy, sw, sh
          );

          // Draw crop border
          ctx.strokeStyle = '#818cf8';
          ctx.lineWidth = 2;
          ctx.setLineDash([]);
          ctx.strokeRect(sx, sy, sw, sh);

          // Draw grid (rule of thirds)
          ctx.strokeStyle = 'rgba(255,255,255,0.2)';
          ctx.lineWidth = 1;
          for (let i = 1; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(sx + (sw / 3) * i, sy);
            ctx.lineTo(sx + (sw / 3) * i, sy + sh);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(sx, sy + (sh / 3) * i);
            ctx.lineTo(sx + sw, sy + (sh / 3) * i);
            ctx.stroke();
          }

          // Corner handles
          const hs = 8;
          ctx.fillStyle = '#818cf8';
          [[sx, sy], [sx + sw, sy], [sx, sy + sh], [sx + sw, sy + sh]].forEach(([hx, hy]) => {
            ctx.fillRect(hx - hs / 2, hy - hs / 2, hs, hs);
          });
        };

        const handleRatioChange = (key: string) => {
          setRatio(key);
          if (key === 'free') return;
          const r = ASPECT_RATIOS.find(a => a.key === key);
          if (!r || !r.w || !r.h) return;

          const targetRatio = r.w / r.h;
          const currentRatio = info.width / info.height;
          let nw: number, nh: number;

          if (currentRatio > targetRatio) {
            nh = info.height;
            nw = Math.round(nh * targetRatio);
          } else {
            nw = info.width;
            nh = Math.round(nw / targetRatio);
          }

          setCropX(Math.round((info.width - nw) / 2));
          setCropY(Math.round((info.height - nh) / 2));
          setCropW(nw);
          setCropH(nh);
        };

        const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
          const rect = canvasRef.current?.getBoundingClientRect();
          if (!rect) return;
          setDragging(true);
          setDragStart({
            x: (e.clientX - rect.left) / scale,
            y: (e.clientY - rect.top) / scale,
          });
        }, [scale]);

        const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
          if (!dragging) return;
          const rect = canvasRef.current?.getBoundingClientRect();
          if (!rect) return;

          const mx = (e.clientX - rect.left) / scale;
          const my = (e.clientY - rect.top) / scale;

          const x1 = Math.min(dragStart.x, mx);
          const y1 = Math.min(dragStart.y, my);
          const x2 = Math.max(dragStart.x, mx);
          const y2 = Math.max(dragStart.y, my);

          let nw = Math.round(x2 - x1);
          let nh = Math.round(y2 - y1);

          if (ratio !== 'free') {
            const r = ASPECT_RATIOS.find(a => a.key === ratio);
            if (r?.w && r?.h) {
              nh = Math.round(nw / (r.w / r.h));
            }
          }

          setCropX(Math.max(0, Math.min(Math.round(x1), info.width - nw)));
          setCropY(Math.max(0, Math.min(Math.round(y1), info.height - nh)));
          setCropW(Math.max(10, Math.min(nw, info.width)));
          setCropH(Math.max(10, Math.min(nh, info.height)));
        }, [dragging, dragStart, scale, ratio, info]);

        const handleMouseUp = useCallback(() => setDragging(false), []);

        const handleCrop = async () => {
          setProcessing(true);
          setError(null);
          try {
            const res = await cropImage(file, { x: cropX, y: cropY, width: cropW, height: cropH });
            setResult(res.file_id, res.info);
          } catch (err: any) {
            setError(err?.response?.data?.detail?.error || 'Crop failed');
          } finally {
            setProcessing(false);
          }
        };

        return (
          <div className="space-y-5">
            {/* Canvas preview */}
            <div ref={containerRef} className="mb-4">
              <canvas
                ref={canvasRef}
                className="rounded-lg cursor-crosshair mx-auto"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </div>

            {/* Aspect ratio */}
            <div>
              <label className="label">Aspect Ratio</label>
              <div className="grid grid-cols-4 gap-1.5">
                {ASPECT_RATIOS.map(a => (
                  <button
                    key={a.key}
                    onClick={() => handleRatioChange(a.key)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      ratio === a.key
                        ? 'bg-primary-500/20 border border-primary-500/40 text-primary-300'
                        : 'bg-surface-800 border border-surface-700 text-surface-400 hover:border-surface-500'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Manual inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">X</label>
                <input type="number" className="input-field" value={cropX}
                  onChange={e => setCropX(Math.max(0, Number(e.target.value)))} min={0} max={info.width} />
              </div>
              <div>
                <label className="label">Y</label>
                <input type="number" className="input-field" value={cropY}
                  onChange={e => setCropY(Math.max(0, Number(e.target.value)))} min={0} max={info.height} />
              </div>
              <div>
                <label className="label">Width</label>
                <input type="number" className="input-field" value={cropW}
                  onChange={e => setCropW(Math.max(1, Number(e.target.value)))} min={1} max={info.width} />
              </div>
              <div>
                <label className="label">Height</label>
                <input type="number" className="input-field" value={cropH}
                  onChange={e => setCropH(Math.max(1, Number(e.target.value)))} min={1} max={info.height} />
              </div>
            </div>

            {/* Result info */}
            <div className="px-3 py-2 rounded-lg bg-surface-800/50 border border-surface-700/50 text-xs">
              <div className="flex justify-between">
                <span className="text-surface-500">Crop area</span>
                <span className="text-primary-400 font-mono">{cropW} x {cropH} px</span>
              </div>
            </div>

            <button onClick={handleCrop} disabled={processing} className="btn-primary w-full flex items-center justify-center gap-2">
              {processing ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
              ) : 'Crop Image'}
            </button>
          </div>
        );
      }}
    </ToolPageWrapper>
  );
}
