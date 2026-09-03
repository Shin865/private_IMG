import type { ImageInfo } from '../services/api';

interface ImageInfoPanelProps {
  info: ImageInfo;
  label?: string;
}

export default function ImageInfoPanel({ info, label }: ImageInfoPanelProps) {
  const rows = [
    { label: 'Dimensions', value: `${info.width} x ${info.height} px` },
    { label: 'Format', value: info.format || 'Unknown' },
    { label: 'Color Mode', value: info.mode || 'Unknown' },
    { label: 'File Size', value: info.file_size_str },
    { label: 'DPI', value: `${info.dpi_x} x ${info.dpi_y}` },
  ];

  if (info.has_alpha) {
    rows.push({ label: 'Transparency', value: 'Yes (Alpha)' });
  }
  if (info.is_animated) {
    rows.push({ label: 'Animated', value: `Yes (${info.n_frames} frames)` });
  }

  return (
    <div className="glass-card p-4">
      {label && (
        <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">
          {label}
        </h3>
      )}
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="text-sm text-surface-400">{row.label}</span>
            <span className="text-sm text-white font-mono">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
