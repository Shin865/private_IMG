import { useState } from 'react';
import ToolPageWrapper from '../components/ToolPageWrapper';
import { convertImage } from '../services/api';

const FORMATS = [
  { key: 'JPEG', label: 'JPG', ext: '.jpg', color: 'from-blue-500 to-cyan-500', desc: 'Best for photos' },
  { key: 'PNG', label: 'PNG', ext: '.png', color: 'from-green-500 to-emerald-500', desc: 'Lossless, transparency' },
  { key: 'WEBP', label: 'WebP', ext: '.webp', color: 'from-purple-500 to-violet-500', desc: 'Modern, small size' },
  { key: 'BMP', label: 'BMP', ext: '.bmp', color: 'from-orange-500 to-amber-500', desc: 'Uncompressed bitmap' },
  { key: 'TIFF', label: 'TIFF', ext: '.tiff', color: 'from-pink-500 to-rose-500', desc: 'Print quality' },
  { key: 'GIF', label: 'GIF', ext: '.gif', color: 'from-yellow-500 to-orange-500', desc: 'Simple animations' },
  { key: 'ICO', label: 'ICO', ext: '.ico', color: 'from-slate-400 to-slate-500', desc: 'Favicon / icon' },
];

export default function Convert() {
  return (
    <ToolPageWrapper title="Convert Image" subtitle="Convert between JPG, PNG, WebP, BMP, TIFF, GIF, and ICO">
      {({ file, info, setResult, processing, setProcessing, setError }) => {
        const [targetFormat, setTargetFormat] = useState('');
        const [quality, setQuality] = useState(95);

        const currentFormat = (info.format || 'Unknown').toUpperCase();
        const selectedFmt = FORMATS.find(f => f.key === targetFormat);
        const supportsQuality = targetFormat === 'JPEG' || targetFormat === 'WEBP';

        const handleConvert = async () => {
          if (!targetFormat) { setError('Select a target format'); return; }
          setProcessing(true);
          setError(null);
          try {
            const res = await convertImage(file, { output_format: targetFormat, quality });
            setResult(res.file_id, res.info);
          } catch (err: any) {
            setError(err?.response?.data?.detail?.error || 'Conversion failed');
          } finally {
            setProcessing(false);
          }
        };

        return (
          <div className="space-y-5">
            {/* Current format */}
            <div className="px-3 py-2 rounded-lg bg-surface-800/50 border border-surface-700/50">
              <div className="flex justify-between text-xs">
                <span className="text-surface-500">Current format</span>
                <span className="text-white font-mono font-bold">{currentFormat}</span>
              </div>
            </div>

            {/* Target format grid */}
            <div>
              <label className="label">Convert to</label>
              <div className="grid grid-cols-2 gap-2">
                {FORMATS.map(fmt => {
                  const isCurrent = fmt.key === currentFormat || (fmt.key === 'JPEG' && currentFormat === 'JPEG');
                  return (
                    <button key={fmt.key} onClick={() => setTargetFormat(fmt.key)}
                      disabled={isCurrent}
                      className={`text-left p-3 rounded-xl transition-all ${
                        targetFormat === fmt.key
                          ? 'bg-primary-500/10 border-2 border-primary-500/40'
                          : isCurrent
                            ? 'bg-surface-800/30 border border-surface-700/30 opacity-40 cursor-not-allowed'
                            : 'bg-surface-800 border border-surface-700 hover:border-surface-500'
                      }`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${fmt.color} flex items-center justify-center`}>
                          <span className="text-white text-[10px] font-bold">{fmt.label}</span>
                        </div>
                        <div>
                          <div className={`text-sm font-medium ${targetFormat === fmt.key ? 'text-primary-300' : 'text-surface-300'}`}>
                            {fmt.label}
                          </div>
                          <div className="text-[10px] text-surface-500">{fmt.desc}</div>
                        </div>
                      </div>
                      {isCurrent && <div className="text-[10px] text-surface-600 mt-1">Current format</div>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quality slider (only for JPEG/WebP) */}
            {supportsQuality && (
              <div>
                <label className="label">Quality: {quality}%</label>
                <input type="range" min={1} max={100} value={quality}
                  onChange={e => setQuality(Number(e.target.value))} className="slider" />
                <div className="flex justify-between text-[10px] text-surface-600 mt-1">
                  <span>1%</span><span>50%</span><span>100%</span>
                </div>
              </div>
            )}

            {/* Conversion preview */}
            {targetFormat && (
              <div className="px-3 py-2 rounded-lg bg-primary-500/5 border border-primary-500/20 animate-fade-in">
                <div className="flex items-center justify-center gap-2 text-sm">
                  <span className="font-mono text-surface-400">{currentFormat}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-400"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
                  <span className="font-mono text-primary-400 font-bold">{selectedFmt?.label}</span>
                </div>
              </div>
            )}

            <button onClick={handleConvert} disabled={processing || !targetFormat} className="btn-primary w-full flex items-center justify-center gap-2">
              {processing ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Converting...</>
              ) : targetFormat ? `Convert to ${selectedFmt?.label}` : 'Select a format'}
            </button>
          </div>
        );
      }}
    </ToolPageWrapper>
  );
}
