import { useState } from 'react';
import ToolPageWrapper from '../components/ToolPageWrapper';
import { resizeImage } from '../services/api';

const PRESETS = [
  { key: 'instagram_square', label: 'Instagram Square', size: '1080x1080' },
  { key: 'instagram_portrait', label: 'Instagram Portrait', size: '1080x1350' },
  { key: 'instagram_landscape', label: 'Instagram Landscape', size: '1080x566' },
  { key: 'facebook_post', label: 'Facebook Post', size: '1200x630' },
  { key: 'facebook_cover', label: 'Facebook Cover', size: '820x312' },
  { key: 'youtube_thumbnail', label: 'YouTube Thumbnail', size: '1280x720' },
  { key: 'twitter_post', label: 'Twitter Post', size: '1200x675' },
  { key: 'whatsapp_dp', label: 'WhatsApp DP', size: '800x800' },
  { key: 'passport', label: 'Passport Photo', size: '413x531' },
  { key: 'hd_720p', label: 'HD 720p', size: '1280x720' },
  { key: 'full_hd_1080p', label: 'Full HD 1080p', size: '1920x1080' },
  { key: '4k', label: '4K UHD', size: '3840x2160' },
  { key: 'a4_300dpi', label: 'A4 (300 DPI)', size: '2480x3508' },
  { key: 'thumbnail_small', label: 'Thumbnail Small', size: '150x150' },
  { key: 'thumbnail_medium', label: 'Thumbnail Medium', size: '300x300' },
];

const ALGORITHMS = [
  { key: 'lanczos', label: 'Lanczos (Best Quality)' },
  { key: 'bicubic', label: 'Bicubic' },
  { key: 'bilinear', label: 'Bilinear' },
  { key: 'nearest', label: 'Nearest (Fastest)' },
];

export default function Resize() {
  return (
    <ToolPageWrapper title="Resize Image" subtitle="Change image dimensions with presets for social media and custom sizes">
      {({ file, info, setResult, processing, setProcessing, setError }) => {
        const [width, setWidth] = useState(info.width);
        const [height, setHeight] = useState(info.height);
        const [lockRatio, setLockRatio] = useState(true);
        const [algorithm, setAlgorithm] = useState('lanczos');
        const [selectedPreset, setSelectedPreset] = useState('');
        const aspectRatio = info.width / info.height;

        const handleWidthChange = (w: number) => {
          setWidth(w);
          if (lockRatio) setHeight(Math.round(w / aspectRatio));
          setSelectedPreset('');
        };

        const handleHeightChange = (h: number) => {
          setHeight(h);
          if (lockRatio) setWidth(Math.round(h * aspectRatio));
          setSelectedPreset('');
        };

        const handlePreset = (key: string) => {
          setSelectedPreset(key);
          const p = PRESETS.find(p => p.key === key);
          if (p) {
            const [w, h] = p.size.split('x').map(Number);
            setWidth(w);
            setHeight(h);
            setLockRatio(false);
          }
        };

        const handleResize = async () => {
          setProcessing(true);
          setError(null);
          try {
            const res = await resizeImage(file, {
              width,
              height,
              maintain_aspect_ratio: lockRatio && !selectedPreset,
              algorithm,
              preset: selectedPreset || undefined,
            });
            setResult(res.file_id, res.info);
          } catch (err: any) {
            setError(err?.response?.data?.detail?.error || 'Resize failed');
          } finally {
            setProcessing(false);
          }
        };

        return (
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-surface-300 uppercase tracking-wider">Dimensions</h3>

            {/* Width */}
            <div>
              <label className="label">Width (px)</label>
              <input
                type="number"
                className="input-field"
                value={width}
                onChange={e => handleWidthChange(Number(e.target.value))}
                min={1}
                max={20000}
              />
            </div>

            {/* Height */}
            <div>
              <label className="label">Height (px)</label>
              <input
                type="number"
                className="input-field"
                value={height}
                onChange={e => handleHeightChange(Number(e.target.value))}
                min={1}
                max={20000}
              />
            </div>

            {/* Lock ratio */}
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={lockRatio}
                onChange={e => setLockRatio(e.target.checked)}
                className="w-4 h-4 rounded bg-surface-700 border-surface-600 text-primary-500 focus:ring-primary-500/50"
              />
              <span className="text-sm text-surface-300 group-hover:text-white transition-colors">
                Lock aspect ratio
              </span>
            </label>

            {/* Algorithm */}
            <div>
              <label className="label">Resize Method</label>
              <select
                className="select-field"
                value={algorithm}
                onChange={e => setAlgorithm(e.target.value)}
              >
                {ALGORITHMS.map(a => (
                  <option key={a.key} value={a.key}>{a.label}</option>
                ))}
              </select>
            </div>

            {/* Presets */}
            <div>
              <label className="label">Presets</label>
              <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {PRESETS.map(p => (
                  <button
                    key={p.key}
                    onClick={() => handlePreset(p.key)}
                    className={`text-left px-3 py-2 rounded-lg text-xs transition-all ${
                      selectedPreset === p.key
                        ? 'bg-primary-500/20 border border-primary-500/40 text-primary-300'
                        : 'bg-surface-800 border border-surface-700 text-surface-400 hover:border-surface-500 hover:text-surface-200'
                    }`}
                  >
                    <div className="font-medium truncate">{p.label}</div>
                    <div className="text-[10px] text-surface-500 font-mono">{p.size}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview info */}
            <div className="px-3 py-2 rounded-lg bg-surface-800/50 border border-surface-700/50">
              <div className="flex items-center justify-between text-xs">
                <span className="text-surface-500">Original</span>
                <span className="text-surface-400 font-mono">{info.width} x {info.height}</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-surface-500">New</span>
                <span className="text-primary-400 font-mono">{width} x {height}</span>
              </div>
            </div>

            {/* Resize button */}
            <button
              onClick={handleResize}
              disabled={processing}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                'Resize Image'
              )}
            </button>
          </div>
        );
      }}
    </ToolPageWrapper>
  );
}
