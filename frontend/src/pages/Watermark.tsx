import { useState } from 'react';
import ToolPageWrapper from '../components/ToolPageWrapper';
import { addWatermark } from '../services/api';

const POSITIONS = [
  { key: 'center', label: 'Center' },
  { key: 'top-left', label: 'Top Left' },
  { key: 'top-right', label: 'Top Right' },
  { key: 'bottom-left', label: 'Bottom Left' },
  { key: 'bottom-right', label: 'Bottom Right' },
];

export default function Watermark() {
  return (
    <ToolPageWrapper title="Watermark" subtitle="Add text watermarks with custom position, opacity, and tiling">
      {({ file, setResult, processing, setProcessing, setError }) => {
        const [text, setText] = useState('SAMPLE');
        const [position, setPosition] = useState('center');
        const [opacity, setOpacity] = useState(30);
        const [rotation, setRotation] = useState(0);
        const [fontSize, setFontSize] = useState(48);
        const [color, setColor] = useState('#FFFFFF');
        const [tiled, setTiled] = useState(false);

        const handleApply = async () => {
          setProcessing(true);
          setError(null);
          try {
            const res = await addWatermark(file, {
              text, position, opacity, rotation,
              font_size: fontSize, color, tiled,
            });
            setResult(res.file_id, res.info);
          } catch (err: any) {
            setError(err?.response?.data?.detail?.error || 'Watermark failed');
          } finally {
            setProcessing(false);
          }
        };

        return (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-surface-300 uppercase tracking-wider">Text Watermark</h3>

            <div>
              <label className="label">Watermark Text</label>
              <input type="text" className="input-field" value={text}
                onChange={e => setText(e.target.value)} placeholder="Enter watermark text" />
            </div>

            <div>
              <label className="label">Position</label>
              <div className="grid grid-cols-3 gap-1.5">
                {POSITIONS.map(p => (
                  <button key={p.key} onClick={() => setPosition(p.key)}
                    className={`py-1.5 rounded-lg text-xs font-medium transition-all ${
                      position === p.key
                        ? 'bg-primary-500/20 border border-primary-500/40 text-primary-300'
                        : 'bg-surface-800 border border-surface-700 text-surface-400 hover:border-surface-500'
                    }`}>{p.label}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Opacity: {opacity}%</label>
              <input type="range" min={5} max={100} value={opacity}
                onChange={e => setOpacity(Number(e.target.value))} className="slider" />
            </div>

            <div>
              <label className="label">Font Size: {fontSize}px</label>
              <input type="range" min={12} max={200} value={fontSize}
                onChange={e => setFontSize(Number(e.target.value))} className="slider" />
            </div>

            <div>
              <label className="label">Rotation: {rotation}deg</label>
              <input type="range" min={-180} max={180} value={rotation}
                onChange={e => setRotation(Number(e.target.value))} className="slider" />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="label">Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={color} onChange={e => setColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-surface-600" />
                  <input type="text" className="input-field flex-1" value={color}
                    onChange={e => setColor(e.target.value)} />
                </div>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" checked={tiled} onChange={e => setTiled(e.target.checked)}
                className="w-4 h-4 rounded bg-surface-700 border-surface-600 text-primary-500" />
              <span className="text-sm text-surface-300 group-hover:text-white transition-colors">
                Tiled (repeat across image)
              </span>
            </label>

            <button onClick={handleApply} disabled={processing} className="btn-primary w-full flex items-center justify-center gap-2">
              {processing ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Applying...</>
              ) : 'Add Watermark'}
            </button>
          </div>
        );
      }}
    </ToolPageWrapper>
  );
}
