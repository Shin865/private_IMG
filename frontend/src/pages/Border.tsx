import { useState } from 'react';
import ToolPageWrapper from '../components/ToolPageWrapper';

const API_BASE = 'http://localhost:8000/api';

export default function Border() {
  return (
    <ToolPageWrapper title="Border & Canvas" subtitle="Add borders, padding, or resize canvas around your image">
      {({ file, info, setResult, processing, setProcessing, setError }) => {
        const [mode, setMode] = useState<'border' | 'canvas'>('border');
        const [uniform, setUniform] = useState(true);
        const [borderSize, setBorderSize] = useState(20);
        const [top, setTop] = useState(20);
        const [bottom, setBottom] = useState(20);
        const [left, setLeft] = useState(20);
        const [right, setRight] = useState(20);
        const [color, setColor] = useState('#FFFFFF');
        const [canvasW, setCanvasW] = useState(info.width + 100);
        const [canvasH, setCanvasH] = useState(info.height + 100);
        const [canvasPos, setCanvasPos] = useState('center');

        const handleApplyBorder = async () => {
          setProcessing(true);
          setError(null);
          try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('top', String(uniform ? borderSize : top));
            formData.append('bottom', String(uniform ? borderSize : bottom));
            formData.append('left', String(uniform ? borderSize : left));
            formData.append('right', String(uniform ? borderSize : right));
            formData.append('color', color);

            const res = await fetch(`${API_BASE}/image/border`, {
              method: 'POST', body: formData,
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.detail?.error || 'Failed');
            setResult(data.file_id, data.info);
          } catch (err: any) {
            setError(err.message || 'Border failed');
          } finally {
            setProcessing(false);
          }
        };

        const handleCanvasResize = async () => {
          setProcessing(true);
          setError(null);
          try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('canvas_width', String(canvasW));
            formData.append('canvas_height', String(canvasH));
            formData.append('position', canvasPos);
            formData.append('color', color);

            const res = await fetch(`${API_BASE}/image/canvas-resize`, {
              method: 'POST', body: formData,
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.detail?.error || 'Failed');
            setResult(data.file_id, data.info);
          } catch (err: any) {
            setError(err.message || 'Canvas resize failed');
          } finally {
            setProcessing(false);
          }
        };

        const CANVAS_POSITIONS = [
          'top-left', 'top-center', 'top-right',
          'center-left', 'center', 'center-right',
          'bottom-left', 'bottom-center', 'bottom-right',
        ];

        return (
          <div className="space-y-4">
            {/* Mode tabs */}
            <div className="flex bg-surface-800 rounded-xl p-1">
              <button onClick={() => setMode('border')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === 'border' ? 'bg-primary-500/20 text-primary-300' : 'text-surface-400 hover:text-surface-200'
                }`}>Border</button>
              <button onClick={() => setMode('canvas')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === 'canvas' ? 'bg-primary-500/20 text-primary-300' : 'text-surface-400 hover:text-surface-200'
                }`}>Canvas</button>
            </div>

            {/* Border mode */}
            {mode === 'border' && (
              <div className="space-y-4 animate-fade-in">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={uniform} onChange={e => setUniform(e.target.checked)}
                    className="w-4 h-4 rounded bg-surface-700 border-surface-600 text-primary-500" />
                  <span className="text-sm text-surface-300">Uniform border</span>
                </label>

                {uniform ? (
                  <div>
                    <label className="label">Border Size: {borderSize}px</label>
                    <input type="range" min={0} max={200} value={borderSize}
                      onChange={e => setBorderSize(Number(e.target.value))} className="slider" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="label">Top</label><input type="number" className="input-field" value={top} onChange={e => setTop(Number(e.target.value))} min={0} /></div>
                    <div><label className="label">Bottom</label><input type="number" className="input-field" value={bottom} onChange={e => setBottom(Number(e.target.value))} min={0} /></div>
                    <div><label className="label">Left</label><input type="number" className="input-field" value={left} onChange={e => setLeft(Number(e.target.value))} min={0} /></div>
                    <div><label className="label">Right</label><input type="number" className="input-field" value={right} onChange={e => setRight(Number(e.target.value))} min={0} /></div>
                  </div>
                )}

                <div>
                  <label className="label">Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={color} onChange={e => setColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border border-surface-600" />
                    <input type="text" className="input-field flex-1" value={color} onChange={e => setColor(e.target.value)} />
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    {['#FFFFFF','#000000','#F87171','#FBBF24','#34D399','#60A5FA','#A78BFA'].map(c => (
                      <button key={c} onClick={() => setColor(c)}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${color === c ? 'border-primary-400 scale-110' : 'border-surface-600'}`}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>

                <button onClick={handleApplyBorder} disabled={processing} className="btn-primary w-full flex items-center justify-center gap-2">
                  {processing ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Applying...</> : 'Add Border'}
                </button>
              </div>
            )}

            {/* Canvas mode */}
            {mode === 'canvas' && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Width</label><input type="number" className="input-field" value={canvasW} onChange={e => setCanvasW(Number(e.target.value))} min={1} /></div>
                  <div><label className="label">Height</label><input type="number" className="input-field" value={canvasH} onChange={e => setCanvasH(Number(e.target.value))} min={1} /></div>
                </div>

                <div>
                  <label className="label">Image Position</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {CANVAS_POSITIONS.map(p => (
                      <button key={p} onClick={() => setCanvasPos(p)}
                        className={`py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                          canvasPos === p
                            ? 'bg-primary-500/20 border border-primary-500/40 text-primary-300'
                            : 'bg-surface-800 border border-surface-700 text-surface-400 hover:border-surface-500'
                        }`}>{p.replace('-', ' ')}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label">Background</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={color} onChange={e => setColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border border-surface-600" />
                    <input type="text" className="input-field flex-1" value={color} onChange={e => setColor(e.target.value)} />
                  </div>
                </div>

                <button onClick={handleCanvasResize} disabled={processing} className="btn-primary w-full flex items-center justify-center gap-2">
                  {processing ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Applying...</> : 'Resize Canvas'}
                </button>
              </div>
            )}
          </div>
        );
      }}
    </ToolPageWrapper>
  );
}
