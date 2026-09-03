import { useState } from 'react';
import ToolPageWrapper from '../components/ToolPageWrapper';


const API_BASE = 'http://localhost:8000/api';

const PIPELINE_STEPS = [
  { icon: '🎨', label: 'Auto White Balance', desc: 'Correct color cast' },
  { icon: '📊', label: 'CLAHE Contrast', desc: 'Adaptive histogram equalization' },
  { icon: '☀️', label: 'Auto Brightness', desc: 'Analysis-based correction' },
  { icon: '🔍', label: 'Adaptive Sharpening', desc: 'Detail enhancement' },
  { icon: '🌈', label: 'Color Vibrance', desc: 'Subtle saturation boost' },
];

export default function Enhance() {
  return (
    <ToolPageWrapper title="AI Enhance" subtitle="One-click AI-powered image enhancement pipeline">
      {({ file, setResult, processing, setProcessing, setError }) => {
        const [strength, setStrength] = useState(1.0);

        const handleEnhance = async () => {
          setProcessing(true);
          setError(null);
          try {
            // Use fetch directly to pass strength param
            const formData = new FormData();
            formData.append('file', file);
            formData.append('strength', String(strength));

            const res = await fetch(`${API_BASE}/image/enhance`, {
              method: 'POST', body: formData,
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.detail?.error || 'Failed');
            setResult(data.file_id, data.info);
          } catch (err: any) {
            setError(err.message || 'Enhancement failed');
          } finally {
            setProcessing(false);
          }
        };

        const strengthLabel = strength <= 0.5 ? 'Subtle' : strength <= 1.0 ? 'Normal' : strength <= 1.5 ? 'Strong' : 'Maximum';

        return (
          <div className="space-y-4">
            {/* AI badge */}
            <div className="px-3 py-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs text-amber-300 font-medium">AI Enhancement Pipeline</span>
              </div>
              <p className="text-[10px] text-surface-500">
                Automatically analyzes and enhances your image using a multi-step AI pipeline.
                All processing runs locally on your computer.
              </p>
            </div>

            {/* Pipeline steps */}
            <div>
              <label className="label">Enhancement Pipeline</label>
              <div className="space-y-1">
                {PIPELINE_STEPS.map((step, i) => (
                  <div key={i} className="flex items-center gap-2.5 py-1.5 px-2.5 rounded-lg bg-surface-800/30">
                    <span className="text-sm">{step.icon}</span>
                    <div className="flex-1">
                      <div className="text-xs text-surface-300 font-medium">{step.label}</div>
                      <div className="text-[10px] text-surface-600">{step.desc}</div>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  </div>
                ))}
              </div>
            </div>

            {/* Strength slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="label mb-0">Strength</label>
                <span className="text-xs text-primary-400 font-medium">{strengthLabel}</span>
              </div>
              <input type="range" min={0.1} max={2.0} step={0.1} value={strength}
                onChange={e => setStrength(Number(e.target.value))} className="slider" />
              <div className="flex justify-between text-[10px] text-surface-600 mt-1">
                <span>Subtle</span><span>Normal</span><span>Strong</span><span>Max</span>
              </div>
            </div>

            {/* Current value display */}
            <div className="px-3 py-2 rounded-lg bg-surface-800/50 border border-surface-700/50">
              <div className="flex justify-between text-xs">
                <span className="text-surface-500">Strength value</span>
                <span className="text-white font-mono font-bold">{strength.toFixed(1)}</span>
              </div>
            </div>

            <button onClick={handleEnhance} disabled={processing}
              className="btn-primary w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500">
              {processing ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enhancing...</>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                  Auto Enhance
                </>
              )}
            </button>
          </div>
        );
      }}
    </ToolPageWrapper>
  );
}
