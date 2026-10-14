import { Link } from 'react-router-dom';

const tools = [
  {
    title: 'Resize',
    description: 'Change image dimensions with presets for social media',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
    ),
    path: '/resize',
    color: 'from-blue-500 to-cyan-500',
    shadow: 'shadow-blue-500/20',
  },
  {
    title: 'Crop',
    description: 'Crop images with custom or preset aspect ratios',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6.13 1 6 16a2 2 0 0 0 2 2h15"/><path d="M1 6.13 16 6a2 2 0 0 1 2 2v15"/></svg>
    ),
    path: '/crop',
    color: 'from-green-500 to-emerald-500',
    shadow: 'shadow-green-500/20',
  },
  {
    title: 'Rotate & Flip',
    description: 'Rotate by any angle, flip horizontal or vertical',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
    ),
    path: '/rotate',
    color: 'from-orange-500 to-amber-500',
    shadow: 'shadow-orange-500/20',
  },
  {
    title: 'Compress',
    description: 'Reduce file size with quality or target size control',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m8 17 4 4 4-4"/></svg>
    ),
    path: '/compress',
    color: 'from-purple-500 to-violet-500',
    shadow: 'shadow-purple-500/20',
  },
  {
    title: 'Convert',
    description: 'Convert between JPG, PNG, WebP, BMP, TIFF, GIF, ICO',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>
    ),
    path: '/convert',
    color: 'from-pink-500 to-rose-500',
    shadow: 'shadow-pink-500/20',
  },
  {
    title: 'Photo Editor',
    description: 'Adjust brightness, contrast, saturation & apply filters',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
    ),
    path: '/editor',
    color: 'from-indigo-500 to-blue-500',
    shadow: 'shadow-indigo-500/20',
  },
  {
    title: 'Remove Background',
    description: 'AI-powered background removal — 100% local',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M20.4 14.5 16 10 4 20"/></svg>
    ),
    path: '/remove-bg',
    color: 'from-teal-500 to-emerald-500',
    shadow: 'shadow-teal-500/20',
    badge: 'AI',
  },
  {
    title: 'Upscale',
    description: 'AI super-resolution — enlarge images up to 4x',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
    ),
    path: '/upscale',
    color: 'from-yellow-500 to-orange-500',
    shadow: 'shadow-yellow-500/20',
    badge: 'AI',
  },
  {
    title: 'AI Enhance',
    description: 'One-click enhancement — denoise, sharpen & upscale',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
    ),
    path: '/enhance',
    color: 'from-fuchsia-500 to-pink-500',
    shadow: 'shadow-fuchsia-500/20',
    badge: 'AI',
  },
  {
    title: 'Watermark',
    description: 'Add text or image watermarks with full control',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
    ),
    path: '/watermark',
    color: 'from-sky-500 to-blue-500',
    shadow: 'shadow-sky-500/20',
  },
  {
    title: 'Border & Canvas',
    description: 'Add borders, padding and expand canvas size',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
    ),
    path: '/border',
    color: 'from-lime-500 to-green-500',
    shadow: 'shadow-lime-500/20',
  },
  {
    title: 'Metadata',
    description: 'View EXIF data and remove metadata for privacy',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
    ),
    path: '/metadata',
    color: 'from-slate-400 to-slate-500',
    shadow: 'shadow-slate-500/20',
  },
  {
    title: 'Batch Processing',
    description: 'Process 100+ images at once — resize, convert, compress',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 3H8l-2 4h12l-2-4z"/></svg>
    ),
    path: '/batch',
    color: 'from-red-500 to-rose-500',
    shadow: 'shadow-red-500/20',
  },
];

export default function Home() {
  return (
    <div className="page-container">
      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M20.4 14.5 16 10 4 20"/></svg>
          </div>
          <h1 className="page-title text-4xl">Image Tool</h1>
        </div>
        <p className="page-subtitle text-lg max-w-2xl">
          All your image editing needs in one place.
        </p>
      </div>

      {/* Tool Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tools.map((tool) => (
          <Link key={tool.path} to={tool.path} className="group">
            <div className={`tool-card relative overflow-hidden`}>
              {/* Gradient glow on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300 rounded-2xl`} />
              
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4 shadow-lg ${tool.shadow} group-hover:scale-110 transition-transform duration-300`}>
                <span className="text-white">{tool.icon}</span>
              </div>

              {/* Content */}
              <div className="relative">
                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="font-semibold text-white group-hover:text-primary-300 transition-colors">
                    {tool.title}
                  </h3>
                  {tool.badge && (
                    <span className="badge text-[10px]">{tool.badge}</span>
                  )}
                </div>
                <p className="text-sm text-surface-400 leading-relaxed">
                  {tool.description}
                </p>
              </div>

              {/* Arrow */}
              <div className="absolute top-6 right-6 text-surface-600 group-hover:text-surface-400 transition-all duration-300 group-hover:translate-x-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Supported Formats */}
      <div className="mt-10 glass-card p-6">
        <h2 className="text-sm font-semibold text-surface-300 uppercase tracking-wider mb-4">
          Supported Formats
        </h2>
        <div className="flex flex-wrap gap-2">
          {['JPG', 'JPEG', 'PNG', 'WebP', 'BMP', 'TIFF', 'GIF', 'ICO'].map((fmt) => (
            <span
              key={fmt}
              className="px-3 py-1.5 rounded-lg bg-surface-800 text-surface-300 text-sm font-mono border border-surface-700 hover:border-primary-500/30 hover:text-primary-300 transition-colors cursor-default"
            >
              .{fmt.toLowerCase()}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
