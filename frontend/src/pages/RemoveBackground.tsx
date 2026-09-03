import { useState } from 'react';
import ToolPageWrapper from '../components/ToolPageWrapper';
import { removeBackground } from '../services/api';

const MODELS = [
  { key: 'u2net', label: 'U2-Net', desc: 'Best for general objects', color: 'from-violet-500 to-purple-600' },
  { key: 'u2netp', label: 'U2-Net Lite', desc: 'Faster, less accurate', color: 'from-blue-400 to-cyan-500' },
  { key: 'u2net_human_seg', label: 'Human Seg', desc: 'Optimized for people', color: 'from-pink-500 to-rose-500' },
  { key: 'silueta', label: 'Silueta', desc: 'Lightweight', color: 'from-emerald-500 to-green-500' },
  { key: 'isnet-general-use', label: 'IS-Net', desc: 'High quality', color: 'from-amber-500 to-orange-500' },
];

const BG_OPTIONS = [
  { key: 'transparent', label: 'Transparent', preview: 'bg-[url("data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2216%22%20height=%2216%22%3E%3Crect%20width=%228%22%20height=%228%22%20fill=%22%23ccc%22/%3E%3Crect%20x=%228%22%20y=%228%22%20width=%228%22%20height=%228%22%20fill=%22%23ccc%22/%3E%3C/svg%3E")]' },
  { key: 'white', label: 'White', preview: 'bg-white' },
  { key: 'black', label: 'Black', preview: 'bg-black' },
  { key: 'custom', label: 'Custom', preview: 'bg-surface-600' },
];

export default function RemoveBackground() {
  return (
    <ToolPageWrapper title="Remove Background" subtitle="AI-powered background removal using U2-Net (runs locally)">
      {({ file, setResult, processing, setProcessing, setError }) => {
        const [model, setModel] = useState('u2net');
        const [bgType, setBgType] = useState('transparent');
        const [bgColor, setBgColor] = useState('#FFFFFF');
        const [alphaMatte, setAlphaMatte] = useState(false);

        const handleRemove = async () => {
          setProcessing(true);
          setError(null);
          try {
            const params: Record<string, string | number | boolean> = {
              model,
              background_type: bgType === 'transparent' ? 'transparent' : 'color',
              alpha_matting: alphaMatte,
            };
            if (bgType === 'white') params.background_color = '#FFFFFF';
            else if (bgType === 'black') params.background_color = '#000000';
            else if (bgType === 'custom') params.background_color = bgColor;

            const res = await removeBackground(file, params);
            setResult(res.file_id, res.info);
          } catch (err: any) {
            setError(err?.response?.data?.detail?.error || 'Background removal failed. Model may need to download first.');
          } finally {
            setProcessing(false);
          }
        };

        return (
          <div className="space-y-4">
            {/* AI badge */}
            <div className="px-3 py-2 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                <span className="text-xs text-violet-300 font-medium">AI-Powered - Runs Locally</span>
              </div>
              <p className="text-[10px] text-surface-500 mt-1">First use may download the model (~170MB)</p>
            </div>

            {/* Model selection */}
            <div>
              <label className="label">AI Model</label>
              <div className="space-y-1.5">
                {MODELS.map(m => (
                  <button key={m.key} onClick={() => setModel(m.key)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center gap-2.5 ${
                      model === m.key
                        ? 'bg-primary-500/10 border-2 border-primary-500/40'
                        : 'bg-surface-800 border border-surface-700 hover:border-surface-500'
                    }`}>
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${m.color} flex items-center justify-center flex-shrink-0`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 12l7-7"/></svg>
                    </div>
                    <div>
                      <div className={`text-sm font-medium ${model === m.key ? 'text-primary-300' : 'text-surface-300'}`}>{m.label}</div>
                      <div className="text-[10px] text-surface-500">{m.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Background type */}
            <div>
              <label className="label">Background</label>
              <div className="grid grid-cols-4 gap-1.5">
                {BG_OPTIONS.map(bg => (
                  <button key={bg.key} onClick={() => setBgType(bg.key)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                      bgType === bg.key
                        ? 'bg-primary-500/10 border-2 border-primary-500/40'
                        : 'bg-surface-800 border border-surface-700 hover:border-surface-500'
                    }`}>
                    <div className={`w-6 h-6 rounded ${bg.preview} border border-surface-600`} />
                    <span className="text-[10px] text-surface-400">{bg.label}</span>
                  </button>
                ))}
              </div>
              {bgType === 'custom' && (
                <div className="flex items-center gap-2 mt-2">
                  <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-surface-600" />
                  <input type="text" className="input-field flex-1" value={bgColor}
                    onChange={e => setBgColor(e.target.value)} />
                </div>
              )}
            </div>

            {/* Alpha matting */}
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" checked={alphaMatte} onChange={e => setAlphaMatte(e.target.checked)}
                className="w-4 h-4 rounded bg-surface-700 border-surface-600 text-primary-500" />
              <div>
                <span className="text-sm text-surface-300 group-hover:text-white transition-colors">
                  Alpha Matting
                </span>
                <p className="text-[10px] text-surface-600">Better edges for hair/fur (slower)</p>
              </div>
            </label>

            <button onClick={handleRemove} disabled={processing}
              className="btn-primary w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500">
              {processing ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Removing Background...</>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 12l7-7"/></svg>
                  Remove Background
                </>
              )}
            </button>
          </div>
        );
      }}
    </ToolPageWrapper>
  );
}
