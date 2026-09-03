import { useState } from 'react';
import ToolPageWrapper from '../components/ToolPageWrapper';
import { getMetadata, removeMetadata } from '../services/api';

export default function Metadata() {
  return (
    <ToolPageWrapper title="Metadata" subtitle="View EXIF data and strip metadata for privacy">
      {({ file, info, setResult, processing, setProcessing, setError }) => {
        const [exifData, setExifData] = useState<Record<string, string> | null>(info.exif || null);
        const [showAll, setShowAll] = useState(false);

        const handleLoadExif = async () => {
          setProcessing(true);
          setError(null);
          try {
            const res = await getMetadata(file);
            setExifData(res.info.exif || {});
          } catch (err: any) {
            setError(err?.response?.data?.detail?.error || 'Failed to load metadata');
          } finally {
            setProcessing(false);
          }
        };

        const handleRemoveMetadata = async () => {
          setProcessing(true);
          setError(null);
          try {
            const res = await removeMetadata(file, { remove_exif: true });
            setResult(res.file_id, res.info);
            setExifData(null);
          } catch (err: any) {
            setError(err?.response?.data?.detail?.error || 'Failed to remove metadata');
          } finally {
            setProcessing(false);
          }
        };

        const exifEntries = exifData ? Object.entries(exifData) : [];
        const displayEntries = showAll ? exifEntries : exifEntries.slice(0, 15);

        return (
          <div className="space-y-4">
            {/* Image basic info */}
            <div>
              <h3 className="text-sm font-semibold text-surface-300 uppercase tracking-wider mb-3">Basic Info</h3>
              <div className="space-y-1.5">
                {[
                  ['Dimensions', `${info.width} x ${info.height} px`],
                  ['Format', info.format],
                  ['Color Mode', info.mode],
                  ['File Size', info.file_size_str],
                  ['DPI', `${info.dpi_x} x ${info.dpi_y}`],
                  ['Has Alpha', info.has_alpha ? 'Yes' : 'No'],
                  ['Animated', info.is_animated ? `Yes (${info.n_frames} frames)` : 'No'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between items-center text-xs py-1 px-2 rounded bg-surface-800/30">
                    <span className="text-surface-400">{label}</span>
                    <span className="text-white font-mono">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* EXIF data */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-surface-300 uppercase tracking-wider">EXIF Data</h3>
                {!exifData && (
                  <button onClick={handleLoadExif} disabled={processing}
                    className="text-xs text-primary-400 hover:text-primary-300">Load EXIF</button>
                )}
              </div>

              {exifData && exifEntries.length === 0 && (
                <p className="text-xs text-surface-500 text-center py-4">No EXIF data found</p>
              )}

              {exifData && exifEntries.length > 0 && (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {displayEntries.map(([key, val]) => (
                    <div key={key} className="flex justify-between items-start text-xs py-1 px-2 rounded bg-surface-800/30 gap-2">
                      <span className="text-surface-400 flex-shrink-0">{key}</span>
                      <span className="text-surface-300 font-mono text-right truncate max-w-[150px]" title={val}>{val}</span>
                    </div>
                  ))}
                  {exifEntries.length > 15 && (
                    <button onClick={() => setShowAll(!showAll)}
                      className="text-xs text-primary-400 hover:text-primary-300 w-full text-center py-1">
                      {showAll ? 'Show less' : `Show all (${exifEntries.length})`}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 space-y-2">
              <button onClick={handleRemoveMetadata} disabled={processing}
                className="btn-primary w-full flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 border-red-500/30">
                {processing ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    Strip All Metadata
                  </>
                )}
              </button>
              <p className="text-[10px] text-surface-600 text-center">
                Removes EXIF data for privacy (camera info, GPS location, etc.)
              </p>
            </div>
          </div>
        );
      }}
    </ToolPageWrapper>
  );
}
