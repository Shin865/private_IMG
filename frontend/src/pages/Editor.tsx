import { useState } from 'react';
import ToolPageWrapper from '../components/ToolPageWrapper';
import { adjustImage, applyFilter, getImageUrl } from '../services/api';

const ADJUSTMENTS = [
  { key: 'brightness', label: 'Brightness', min: -100, max: 100, step: 1, default: 0 },
  { key: 'contrast', label: 'Contrast', min: -100, max: 100, step: 1, default: 0 },
  { key: 'saturation', label: 'Saturation', min: -100, max: 100, step: 1, default: 0 },
  { key: 'sharpness', label: 'Sharpness', min: -100, max: 100, step: 1, default: 0 },
  { key: 'exposure', label: 'Exposure', min: -100, max: 100, step: 1, default: 0 },
  { key: 'temperature', label: 'Temperature', min: -100, max: 100, step: 1, default: 0 },
  { key: 'blur', label: 'Blur', min: 0, max: 100, step: 1, default: 0 },
];

const FILTERS = [
  { key: 'grayscale', label: 'Grayscale', color: 'from-gray-500 to-gray-600' },
  { key: 'sepia', label: 'Sepia', color: 'from-amber-600 to-yellow-700' },
  { key: 'vintage', label: 'Vintage', color: 'from-orange-700 to-amber-800' },
  { key: 'bw', label: 'B&W', color: 'from-gray-800 to-black' },
  { key: 'blur', label: 'Blur', color: 'from-blue-400 to-blue-600' },
  { key: 'sharpen', label: 'Sharpen', color: 'from-cyan-500 to-teal-500' },
  { key: 'emboss', label: 'Emboss', color: 'from-stone-500 to-stone-600' },
  { key: 'edge_detection', label: 'Edges', color: 'from-green-500 to-emerald-600' },
];

export default function Editor() {
  return (
    <ToolPageWrapper title="Photo Editor" subtitle="Adjust brightness, contrast, saturation and apply filters">
      {({ file, resultFileId, setResult, processing, setProcessing, setError }) => {
        const [tab, setTab] = useState<'adjust' | 'filter'>('adjust');
        const [values, setValues] = useState<Record<string, number>>(
          Object.fromEntries(ADJUSTMENTS.map(a => [a.key, a.default]))
        );
        // Undo/Redo history
        const [history, setHistory] = useState<Array<{ type: string; label: string }>>([]);
        const [activeFilter, setActiveFilter] = useState<string | null>(null);

        const updateValue = (key: string, val: number) => {
          setValues(prev => ({ ...prev, [key]: val }));
        };

        const resetAll = () => {
          setValues(Object.fromEntries(ADJUSTMENTS.map(a => [a.key, a.default])));
          setActiveFilter(null);
        };

        const getCurrentFile = async (): Promise<File> => {
          if (!resultFileId) return file;
          const response = await fetch(getImageUrl(resultFileId));
          const blob = await response.blob();
          return new File([blob], file.name, { type: blob.type });
        };

        const handleApplyAdjustments = async () => {
          setProcessing(true);
          setError(null);
          try {
            const params: Record<string, number> = {};
            for (const [k, v] of Object.entries(values)) {
              if (v !== 0) params[k] = v;
            }
            if (Object.keys(params).length === 0) {
              setError('No adjustments to apply');
              setProcessing(false);
              return;
            }
            const targetFile = await getCurrentFile();
            const res = await adjustImage(targetFile, params);
            setResult(res.file_id, res.info);
            const changed = Object.entries(params).map(([k, v]) => `${k}: ${v > 0 ? '+' : ''}${v}`).join(', ');
            setHistory(prev => [...prev, { type: 'adjust', label: changed }]);
            
            // Reset sliders to center so edits are clearly cumulative
            setValues(Object.fromEntries(ADJUSTMENTS.map(a => [a.key, a.default])));
          } catch (err: any) {
            setError(err?.response?.data?.detail?.error || 'Adjustment failed');
          } finally {
            setProcessing(false);
          }
        };

        const handleApplyFilter = async (filterKey: string) => {
          setProcessing(true);
          setError(null);
          setActiveFilter(filterKey);
          try {
            const targetFile = await getCurrentFile();
            const res = await applyFilter(targetFile, { filter_name: filterKey });
            setResult(res.file_id, res.info);
            setHistory(prev => [...prev, { type: 'filter', label: filterKey }]);
            setActiveFilter(null); // Reset visual selection after apply
          } catch (err: any) {
            setError(err?.response?.data?.detail?.error || 'Filter failed');
          } finally {
            setProcessing(false);
          }
        };

        return (
          <div className="space-y-4">
            {/* Tab switcher */}
            <div className="flex bg-surface-800 rounded-xl p-1">
              <button onClick={() => setTab('adjust')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === 'adjust' ? 'bg-primary-500/20 text-primary-300' : 'text-surface-400 hover:text-surface-200'
                }`}>
                Adjustments
              </button>
              <button onClick={() => setTab('filter')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === 'filter' ? 'bg-primary-500/20 text-primary-300' : 'text-surface-400 hover:text-surface-200'
                }`}>
                Filters
              </button>
            </div>

            {/* Adjustments tab */}
            {tab === 'adjust' && (
              <div className="space-y-3 animate-fade-in">
                {ADJUSTMENTS.map(adj => (
                  <div key={adj.key}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-surface-400">{adj.label}</label>
                      <span className="text-xs font-mono text-surface-500 w-10 text-right">
                        {values[adj.key]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="range" min={adj.min} max={adj.max} step={adj.step}
                        value={values[adj.key]}
                        onChange={e => updateValue(adj.key, Number(e.target.value))}
                        className="slider flex-1" />
                      <button onClick={() => updateValue(adj.key, adj.default)}
                        className="p-1 rounded text-surface-600 hover:text-surface-300 transition-colors"
                        title="Reset">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                      </button>
                    </div>
                  </div>
                ))}

                <div className="flex gap-2 pt-2">
                  <button onClick={handleApplyAdjustments} disabled={processing}
                    className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                    {processing ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Applying...</>
                    ) : 'Apply Adjustments'}
                  </button>
                  <button onClick={resetAll} className="btn-secondary text-sm px-3">Reset</button>
                </div>
              </div>
            )}

            {/* Filters tab */}
            {tab === 'filter' && (
              <div className="space-y-3 animate-fade-in">
                <div className="grid grid-cols-2 gap-2">
                  {FILTERS.map(f => (
                    <button key={f.key} onClick={() => handleApplyFilter(f.key)}
                      disabled={processing}
                      className={`flex items-center gap-2.5 p-3 rounded-xl transition-all ${
                        activeFilter === f.key
                          ? 'bg-primary-500/10 border-2 border-primary-500/40'
                          : 'bg-surface-800 border border-surface-700 hover:border-surface-500'
                      }`}>
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${f.color} flex-shrink-0`} />
                      <span className={`text-sm font-medium ${
                        activeFilter === f.key ? 'text-primary-300' : 'text-surface-300'
                      }`}>{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Edit history */}
            {history.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">History</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {history.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-surface-500 py-1 px-2 rounded bg-surface-800/50">
                      <span className={`w-1.5 h-1.5 rounded-full ${h.type === 'adjust' ? 'bg-blue-400' : 'bg-purple-400'}`} />
                      <span className="truncate">{h.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {processing && (
              <div className="flex items-center justify-center gap-2 text-sm text-surface-400 py-2">
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
