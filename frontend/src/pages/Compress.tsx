import { useState } from 'react';
import ToolPageWrapper from '../components/ToolPageWrapper';
import { compressImage } from '../services/api';

export default function Compress() {
  return (
    <ToolPageWrapper title="Compress Image" subtitle="Reduce file size with quality control or target size">
      {({ file, info, setResult, processing, setProcessing, setError }) => {
        const [mode, setMode] = useState<'preset' | 'quality' | 'target'>('preset');
        const [preset, setPreset] = useState('medium');
        const [quality, setQuality] = useState(80);
        const [targetKB, setTargetKB] = useState(500);
        const [compressionResult, setCompressionResult] = useState<{ratio: number, originalSize: number, compressedSize: number} | null>(null);

        const handleCompress = async () => {
          setProcessing(true);
          setError(null);
          setCompressionResult(null);
          try {
            const params: any = {};
            if (mode === 'preset') params.preset = preset;
            else if (mode === 'quality') params.quality = quality;
            else if (mode === 'target') params.target_size_kb = targetKB;

            const res = await compressImage(file, params);
            setResult(res.file_id, res.info);
            setCompressionResult({
              ratio: (res as any).compression_ratio || 0,
              originalSize: (res as any).original_size || info.file_size,
              compressedSize: (res as any).compressed_size || 0,
            });
          } catch (err: any) {
            setError(err?.response?.data?.detail?.error || 'Compression failed');
          } finally {
            setProcessing(false);
          }
        };

        const formatSize = (bytes: number) => {
          if (bytes < 1024) return `${bytes} B`;
          if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
          return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
        };

        return (
          <div className="space-y-5">
            {/* Mode selector */}
            <div>
              <label className="label">Compression Mode</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { key: 'preset', label: 'Preset' },
                  { key: 'quality', label: 'Quality' },
                  { key: 'target', label: 'Target Size' },
                ].map(m => (
                  <button key={m.key} onClick={() => setMode(m.key as any)}
                    className={`py-2 rounded-lg text-xs font-medium transition-all ${
                      mode === m.key
                        ? 'bg-primary-500/20 border border-primary-500/40 text-primary-300'
                        : 'bg-surface-800 border border-surface-700 text-surface-400 hover:border-surface-500'
                    }`}>{m.label}</button>
                ))}
              </div>
            </div>

            {/* Preset mode */}
            {mode === 'preset' && (
              <div className="space-y-2">
                {[
                  { key: 'low', label: 'Low Compression', desc: 'Quality ~85% - Minimal size reduction', color: 'text-green-400' },
                  { key: 'medium', label: 'Medium Compression', desc: 'Quality ~60% - Good balance', color: 'text-yellow-400' },
                  { key: 'high', label: 'High Compression', desc: 'Quality ~30% - Maximum reduction', color: 'text-red-400' },
                ].map(p => (
                  <button key={p.key} onClick={() => setPreset(p.key)}
                    className={`w-full text-left p-3 rounded-xl transition-all ${
                      preset === p.key
                        ? 'bg-primary-500/10 border border-primary-500/30'
                        : 'bg-surface-800 border border-surface-700 hover:border-surface-600'
                    }`}>
                    <div className={`text-sm font-medium ${preset === p.key ? 'text-white' : 'text-surface-300'}`}>{p.label}</div>
                    <div className={`text-xs ${p.color} mt-0.5`}>{p.desc}</div>
                  </button>
                ))}
              </div>
            )}

            {/* Quality mode */}
            {mode === 'quality' && (
              <div>
                <label className="label">Quality: {quality}%</label>
                <input type="range" min={1} max={100} value={quality}
                  onChange={e => setQuality(Number(e.target.value))} className="slider" />
                <div className="flex justify-between text-[10px] text-surface-600 mt-1">
                  <span>1% (Smallest)</span><span>50%</span><span>100% (Best)</span>
                </div>
              </div>
            )}

            {/* Target size mode */}
            {mode === 'target' && (
              <div>
                <label className="label">Target Size (KB)</label>
                <input type="number" className="input-field" value={targetKB}
                  onChange={e => setTargetKB(Math.max(1, Number(e.target.value)))} min={1} />
                <p className="text-xs text-surface-500 mt-1">
                  App will find the best quality to match this target size.
                </p>
              </div>
            )}

            {/* Current file info */}
            <div className="px-3 py-2 rounded-lg bg-surface-800/50 border border-surface-700/50">
              <div className="flex justify-between text-xs">
                <span className="text-surface-500">Current size</span>
                <span className="text-surface-300 font-mono">{formatSize(info.file_size)}</span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-surface-500">Format</span>
                <span className="text-surface-300 font-mono">{info.format}</span>
              </div>
            </div>

            {/* Compression result */}
            {compressionResult && (
              <div className="px-3 py-3 rounded-xl bg-green-500/10 border border-green-500/20 animate-slide-up">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-green-400 font-medium">Compressed!</span>
                  <span className="text-green-400 font-mono font-bold">-{compressionResult.ratio}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-surface-400">{formatSize(compressionResult.originalSize)}</span>
                  <span className="text-surface-500">-&gt;</span>
                  <span className="text-green-400 font-mono">{formatSize(compressionResult.compressedSize)}</span>
                </div>
                {/* Progress bar visualization */}
                <div className="mt-2 h-2 bg-surface-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${100 - compressionResult.ratio}%` }} />
                </div>
              </div>
            )}

            <button onClick={handleCompress} disabled={processing} className="btn-primary w-full flex items-center justify-center gap-2">
              {processing ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Compressing...</>
              ) : 'Compress Image'}
            </button>
          </div>
        );
      }}
    </ToolPageWrapper>
  );
}
