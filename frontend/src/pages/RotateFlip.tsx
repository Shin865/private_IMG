import { useState } from 'react';
import ToolPageWrapper from '../components/ToolPageWrapper';
import { rotateImage, flipImage } from '../services/api';

export default function RotateFlip() {
  return (
    <ToolPageWrapper title="Rotate & Flip" subtitle="Rotate by any angle or flip horizontal/vertical">
      {({ file, setResult, processing, setProcessing, setError }) => {
        const [customAngle, setCustomAngle] = useState(0);

        const handleRotate = async (angle: number) => {
          setProcessing(true);
          setError(null);
          try {
            const res = await rotateImage(file, { angle });
            setResult(res.file_id, res.info);
          } catch (err: any) {
            setError(err?.response?.data?.detail?.error || 'Rotate failed');
          } finally {
            setProcessing(false);
          }
        };

        const handleFlip = async (direction: 'horizontal' | 'vertical') => {
          setProcessing(true);
          setError(null);
          try {
            const res = await flipImage(file, { direction });
            setResult(res.file_id, res.info);
          } catch (err: any) {
            setError(err?.response?.data?.detail?.error || 'Flip failed');
          } finally {
            setProcessing(false);
          }
        };

        return (
          <div className="space-y-6">
            {/* Rotate section */}
            <div>
              <h3 className="text-sm font-semibold text-surface-300 uppercase tracking-wider mb-3">Rotate</h3>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => handleRotate(90)} disabled={processing}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-surface-800 border border-surface-700 hover:border-primary-500/30 hover:bg-surface-700 transition-all text-surface-300 hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 2v6h6M2.5 8a10 10 0 0 1 18.2-3.8"/></svg>
                  <span className="text-xs">90° Left</span>
                </button>
                <button onClick={() => handleRotate(180)} disabled={processing}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-surface-800 border border-surface-700 hover:border-primary-500/30 hover:bg-surface-700 transition-all text-surface-300 hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
                  <span className="text-xs">180°</span>
                </button>
                <button onClick={() => handleRotate(270)} disabled={processing}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-surface-800 border border-surface-700 hover:border-primary-500/30 hover:bg-surface-700 transition-all text-surface-300 hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.5 8a10 10 0 0 0-18.2-3.8"/></svg>
                  <span className="text-xs">90° Right</span>
                </button>
              </div>
            </div>

            {/* Custom angle */}
            <div>
              <label className="label">Custom Angle</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  className="input-field flex-1"
                  value={customAngle}
                  onChange={e => setCustomAngle(Number(e.target.value))}
                  min={-360}
                  max={360}
                  step={1}
                />
                <button onClick={() => handleRotate(customAngle)} disabled={processing}
                  className="btn-primary text-sm px-4">
                  Apply
                </button>
              </div>
              {/* Slider */}
              <input
                type="range"
                min={-180}
                max={180}
                value={customAngle}
                onChange={e => setCustomAngle(Number(e.target.value))}
                className="slider mt-2"
              />
              <div className="flex justify-between text-[10px] text-surface-600 mt-0.5">
                <span>-180°</span><span>0°</span><span>180°</span>
              </div>
            </div>

            {/* Flip section */}
            <div>
              <h3 className="text-sm font-semibold text-surface-300 uppercase tracking-wider mb-3">Flip</h3>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleFlip('horizontal')} disabled={processing}
                  className="flex flex-col items-center gap-1.5 p-4 rounded-xl bg-surface-800 border border-surface-700 hover:border-primary-500/30 hover:bg-surface-700 transition-all text-surface-300 hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3"/><path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3"/><line x1="12" y1="2" x2="12" y2="22" strokeDasharray="4 4"/></svg>
                  <span className="text-xs font-medium">Flip Horizontal</span>
                </button>
                <button onClick={() => handleFlip('vertical')} disabled={processing}
                  className="flex flex-col items-center gap-1.5 p-4 rounded-xl bg-surface-800 border border-surface-700 hover:border-primary-500/30 hover:bg-surface-700 transition-all text-surface-300 hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3"/><path d="M3 16v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3"/><line x1="2" y1="12" x2="22" y2="12" strokeDasharray="4 4"/></svg>
                  <span className="text-xs font-medium">Flip Vertical</span>
                </button>
              </div>
            </div>

            {processing && (
              <div className="flex items-center justify-center gap-2 text-sm text-surface-400">
                <div className="w-4 h-4 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                Processing...
              </div>
            )}
          </div>
        );
      }}
    </ToolPageWrapper>
  );
}
