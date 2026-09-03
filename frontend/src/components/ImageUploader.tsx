import { useCallback, useState, useRef } from 'react';

interface ImageUploaderProps {
  onUpload: (file: File) => void;
  accept?: string;
  maxSize?: number; // in bytes
  multiple?: boolean;
  onMultipleUpload?: (files: File[]) => void;
}

export default function ImageUploader({
  onUpload,
  accept = 'image/jpeg,image/png,image/webp,image/bmp,image/tiff,image/gif,image/x-icon',
  maxSize = 50 * 1024 * 1024, // 50MB
  multiple = false,
  onMultipleUpload,
}: ImageUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!file.type.startsWith('image/')) {
        return `"${file.name}" is not an image file.`;
      }
      if (file.size > maxSize) {
        const maxMB = (maxSize / (1024 * 1024)).toFixed(0);
        const fileMB = (file.size / (1024 * 1024)).toFixed(1);
        return `"${file.name}" is too large (${fileMB}MB). Max: ${maxMB}MB.`;
      }
      return null;
    },
    [maxSize]
  );

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      setError(null);
      const fileArray = Array.from(files);

      if (multiple && onMultipleUpload) {
        const validFiles: File[] = [];
        for (const file of fileArray) {
          const err = validateFile(file);
          if (err) {
            setError(err);
            return;
          }
          validFiles.push(file);
        }
        onMultipleUpload(validFiles);
      } else {
        const file = fileArray[0];
        if (!file) return;
        const err = validateFile(file);
        if (err) {
          setError(err);
          return;
        }
        onUpload(file);
      }
    },
    [multiple, onUpload, onMultipleUpload, validateFile]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const onClick = () => {
    inputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      // Reset input so the same file can be selected again
      e.target.value = '';
    }
  };

  return (
    <div className="w-full">
      <div
        className={`upload-zone ${dragOver ? 'dragover' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onClick();
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={onFileChange}
          className="hidden"
        />

        {/* Upload icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 border border-primary-500/20 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary-400"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
        </div>

        {/* Text */}
        <h3 className="text-lg font-semibold text-white mb-1">
          {multiple ? 'Drop images here' : 'Drop an image here'}
        </h3>
        <p className="text-surface-400 text-sm mb-4">
          or click to browse from your computer
        </p>

        {/* Supported formats */}
        <div className="flex flex-wrap justify-center gap-1.5">
          {['JPG', 'PNG', 'WebP', 'BMP', 'TIFF', 'GIF', 'ICO'].map((fmt) => (
            <span
              key={fmt}
              className="px-2 py-0.5 rounded text-xs font-mono text-surface-500 bg-surface-800/80"
            >
              {fmt}
            </span>
          ))}
        </div>

        {/* Size limit */}
        <p className="text-surface-600 text-xs mt-3">
          Max file size: {(maxSize / (1024 * 1024)).toFixed(0)}MB
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-3 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in">
          <span className="font-medium">Error:</span> {error}
        </div>
      )}
    </div>
  );
}
