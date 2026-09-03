import { useState, useCallback } from 'react';
import { downloadImage } from '../services/api';

const API_BASE = 'http://localhost:8000/api';

interface BatchJob {
  job_id: string;
  status: string;
  total: number;
  completed: number;
  failed: number;
  current_file: string;
  results: Array<{ filename: string; file_id: string; file_size_str: string }>;
  errors: Array<{ filename: string; error: string }>;
  zip_id?: string;
}

export default function Batch() {
  const [files, setFiles] = useState<File[]>([]);
  const [operation, setOperation] = useState('resize');
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [outputFormat, setOutputFormat] = useState('JPEG');
  const [quality, setQuality] = useState(85);
  const [job, setJob] = useState<BatchJob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleStart = async () => {
    if (files.length === 0) { setError('No files selected'); return; }
    setProcessing(true);
    setError(null);
    setJob(null);

    try {
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      formData.append('operation', operation);
      if (operation === 'resize' || operation === 'all') {
        formData.append('width', String(width));
        formData.append('height', String(height));
      }
      if (operation === 'convert' || operation === 'all') {
        formData.append('output_format', outputFormat);
      }
      formData.append('quality', String(quality));

      const res = await fetch(`${API_BASE}/image/batch/start`, {
        method: 'POST', body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.detail?.error || 'Failed');

      // Poll for status
      pollStatus(data.job_id);
    } catch (err: any) {
      setError(err.message || 'Batch processing failed');
      setProcessing(false);
    }
  };

  const pollStatus = useCallback(async (jobId: string) => {
    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/image/batch/status/${jobId}`);
        const data: BatchJob = await res.json();
        setJob(data);

        if (data.status === 'processing') {
          setTimeout(poll, 500);
        } else {
          setProcessing(false);
        }
      } catch {
        setProcessing(false);
      }
    };
    poll();
  }, []);

  const handleDownloadZip = () => {
    if (job?.zip_id) {
      downloadImage(job.zip_id, 'batch_output.zip');
    }
  };

  const progress = job ? Math.round(((job.completed + job.failed) / job.total) * 100) : 0;

  return (
    <div className="page-container">
      <h1 className="page-title">Batch Processing</h1>
      <p className="page-subtitle">Process multiple images at once - resize, convert, or compress in bulk</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Controls */}
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-surface-300 uppercase tracking-wider">Settings</h3>

          {/* File input */}
          <div>
            <label className="label">Select Images</label>
            <input type="file" multiple accept="image/*" onChange={handleFilesChange}
              className="w-full text-sm text-surface-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-surface-700 file:text-surface-300 hover:file:bg-surface-600 cursor-pointer" />
            {files.length > 0 && (
              <p className="text-xs text-surface-500 mt-1">{files.length} file(s) selected</p>
            )}
          </div>

          {/* Operation */}
          <div>
            <label className="label">Operation</label>
            <select className="select-field" value={operation} onChange={e => setOperation(e.target.value)}>
              <option value="resize">Resize</option>
              <option value="convert">Convert Format</option>
              <option value="compress">Compress</option>
              <option value="all">All (Resize + Convert + Compress)</option>
            </select>
          </div>

          {/* Resize options */}
          {(operation === 'resize' || operation === 'all') && (
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Width</label><input type="number" className="input-field" value={width} onChange={e => setWidth(Number(e.target.value))} min={1} /></div>
              <div><label className="label">Height</label><input type="number" className="input-field" value={height} onChange={e => setHeight(Number(e.target.value))} min={1} /></div>
            </div>
          )}

          {/* Convert options */}
          {(operation === 'convert' || operation === 'all') && (
            <div>
              <label className="label">Output Format</label>
              <select className="select-field" value={outputFormat} onChange={e => setOutputFormat(e.target.value)}>
                <option value="JPEG">JPEG</option>
                <option value="PNG">PNG</option>
                <option value="WEBP">WebP</option>
                <option value="BMP">BMP</option>
              </select>
            </div>
          )}

          {/* Quality */}
          <div>
            <label className="label">Quality: {quality}%</label>
            <input type="range" min={1} max={100} value={quality}
              onChange={e => setQuality(Number(e.target.value))} className="slider" />
          </div>

          <button onClick={handleStart} disabled={processing || files.length === 0}
            className="btn-primary w-full flex items-center justify-center gap-2">
            {processing ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
            ) : `Process ${files.length} File(s)`}
          </button>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <span className="font-medium">Error:</span> {error}
            </div>
          )}

          {job && (
            <div className="glass-card p-5 space-y-4 animate-fade-in">
              {/* Progress */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-surface-300 font-medium">
                    {job.status === 'processing' ? `Processing: ${job.current_file}` : `Status: ${job.status}`}
                  </span>
                  <span className="text-primary-400 font-mono">{progress}%</span>
                </div>
                <div className="h-2 bg-surface-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }} />
                </div>
                <div className="flex justify-between text-xs text-surface-500 mt-1">
                  <span>{job.completed} completed</span>
                  {job.failed > 0 && <span className="text-red-400">{job.failed} failed</span>}
                  <span>{job.total} total</span>
                </div>
              </div>

              {/* Results list */}
              {job.results.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Results</h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {job.results.map((r, i) => (
                      <div key={i} className="flex justify-between items-center text-xs py-1.5 px-2 rounded bg-surface-800/30">
                        <span className="text-surface-300 truncate max-w-[200px]">{r.filename}</span>
                        <span className="text-surface-500 font-mono">{r.file_size_str}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors */}
              {job.errors.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Errors</h4>
                  <div className="space-y-1">
                    {job.errors.map((e, i) => (
                      <div key={i} className="text-xs py-1.5 px-2 rounded bg-red-500/10 text-red-400">
                        <span className="font-medium">{e.filename}:</span> {e.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Download ZIP */}
              {job.status === 'completed' && job.zip_id && (
                <button onClick={handleDownloadZip} className="btn-primary w-full flex items-center justify-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download All (ZIP)
                </button>
              )}
            </div>
          )}

          {!job && !processing && (
            <div className="glass-card p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-800 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-surface-500"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              </div>
              <h2 className="text-lg font-semibold text-surface-300 mb-2">Ready to process</h2>
              <p className="text-surface-500 text-sm">Select images and configure options to start batch processing.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
