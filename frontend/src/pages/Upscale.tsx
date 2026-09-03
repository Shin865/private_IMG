import { useState } from 'react';
import ToolPageWrapper from '../components/ToolPageWrapper';
import { upscaleImage } from '../services/api';

const METHODS = [
  { key: 'lanczos', label: 'Lanczos', desc: 'High-quality standard', color: 'from-blue-500 to-cyan-500' },
  { key: 'bicubic', label: 'Bicubic', desc: 'Fast, smooth', color: 'from-green-500 to-emerald-500' },
  { key: 'enhanced', label: 'Enhanced', desc: 'Multi-step, best quality', color: 'from-purple-500 to-violet-500' },
];

export default function Upscale() {
  return (
    <ToolPageWrapper title="Upscale Image" subtitle="Increase image resolution with smart interpolation">
      {({ file, info, setResult, processing, setProcessing, setError }) => {
        const [scale, setScale] = useState(2);
        const [method, setMethod] = useState('enhanced');
        const [sharpen, setSharpen] = useState(true);
        const [denoise, setDenoise] = useState(false);

        const outputW = info.width * scale;
        const outputH = info.height * scale;

        const handleUpscale = async () => {
          setProcessing(true);
          setError(null);
          try {
            const res = await upscaleImage(file, { scale, model: method, face_enhance: sharpen });
            setResult(res.file_id, res.info);
          } catch (err: any) {
            setError(err?.response?.data?.detail?.error || 'Upscale failed');
          } finally {
            setProcessing(false);
          }
        };

        return (
          <div className="space-y-4">
            {/* Scale selector */}
            <div>
              <label className="label">Scale Factor</label>
              <div className="grid grid-cols-3 gap-2">
                {[2, 3, 4].map(s => (
                  <button key={s} onClick={() => setScale(s)}
                    className={`py-3 rounded-xl text-center transition-all ${
                      scale === s
                        ? 'bg-primary-500/20 border-2 border-primary-500/40'
                        : 'bg-surface-800 border border-surface-700 hover:border-surface-500'
                    }`}>
                    <div className={`text-2xl font-bold ${scale === s ? 'text-primary-300' : 'text-surface-300'}`}>{s}x</div>
                    <div className="text-[10px] text-surface-500 mt-0.5">
                      {info.width * s} x {info.height * s}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Method */}
            <div>
              <label className="label">Method</label>
              <div className="space-y-1.5">
                {METHODS.map(m => (
                  <button key={m.key} onClick={() => setMethod(m.key)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center gap-2.5 ${
                      method === m.key
                        ? 'bg-primary-500/10 border-2 border-primary-500/40'
                        : 'bg-surface-800 border border-surface-700 hover:border-surface-500'
                    }`}>
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${m.color} flex items-center justify-center flex-shrink-0`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                    </div>
                    <div>
                      <div className={`text-sm font-medium ${method === m.key ? 'text-primary-300' : 'text-surface-300'}`}>{m.label}</div>
                      <div className="text-[10px] text-surface-500">{m.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" checked={sharpen} onChange={e => setSharpen(e.target.checked)}
                  className="w-4 h-4 rounded bg-surface-700 border-surface-600 text-primary-500" />
                <span className="text-sm text-surface-300 group-hover:text-white transition-colors">
                  Auto Sharpen
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" checked={denoise} onChange={e => setDenoise(e.target.checked)}
                  className="w-4 h-4 rounded bg-surface-700 border-surface-600 text-primary-500" />
                <span className="text-sm text-surface-300 group-hover:text-white transition-colors">
                  Denoise
                </span>
              </label>
            </div>

            {/* Output preview */}
            <div className="px-3 py-2 rounded-lg bg-primary-500/5 border border-primary-500/20">
              <div className="flex items-center justify-center gap-3 text-sm">
                <div className="text-center">
                  <div className="text-surface-500 text-[10px]">Input</div>
                  <div className="font-mono text-surface-300">{info.width}x{info.height}</div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary-400"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
                <div className="text-center">
                  <div className="text-primary-500 text-[10px]">Output</div>
                  <div className="font-mono text-primary-300 font-bold">{outputW}x{outputH}</div>
                </div>
              </div>
            </div>

            <button onClick={handleUpscale} disabled={processing}
              className="btn-primary w-full flex items-center justify-center gap-2">
              {processing ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Upscaling...</>
              ) : `Upscale to ${outputW}x${outputH}`}
            </button>
          </div>
        );
      }}
    </ToolPageWrapper>
  );
}
