import { useState, useCallback } from 'react';
import ImageUploader from './ImageUploader';
import ImageViewer from './ImageViewer';
import ImageInfoPanel from './ImageInfoPanel';
import { uploadImage, getImageUrl, downloadImage, type ImageInfo, type UploadResponse } from '../services/api';

interface ToolPageWrapperProps {
  title: string;
  subtitle: string;
  children: (props: {
    file: File;
    fileId: string;
    imageUrl: string;
    info: ImageInfo;
    resultFileId: string | null;
    resultImageUrl: string | null;
    resultInfo: ImageInfo | null;
    setResult: (fileId: string, info: ImageInfo) => void;
    processing: boolean;
    setProcessing: (v: boolean) => void;
    error: string | null;
    setError: (v: string | null) => void;
  }) => React.ReactNode;
}

export default function ToolPageWrapper({ title, subtitle, children }: ToolPageWrapperProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [info, setInfo] = useState<ImageInfo | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Result
  const [resultFileId, setResultFileId] = useState<string | null>(null);
  const [resultInfo, setResultInfo] = useState<ImageInfo | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleUpload = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setResultFileId(null);
    setResultInfo(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      const res: UploadResponse = await uploadImage(selectedFile, (p) => setUploadProgress(p));
      setFileId(res.file_id);
      setInfo(res.info);
    } catch (err: any) {
      const msg = err?.response?.data?.detail?.error || err.message || 'Upload failed';
      setError(msg);
      setFile(null);
    } finally {
      setUploading(false);
    }
  }, []);

  const setResult = useCallback((fId: string, fInfo: ImageInfo) => {
    setResultFileId(fId);
    setResultInfo(fInfo);
  }, []);

  const handleDownload = useCallback(() => {
    if (!resultFileId || !file) return;
    const ext = resultInfo?.extension || '.png';
    const name = file.name.replace(/\.[^.]+$/, '') + '_processed' + ext;
    downloadImage(resultFileId, name);
  }, [resultFileId, resultInfo, file]);

  const handleReset = () => {
    setFile(null);
    setFileId(null);
    setInfo(null);
    setResultFileId(null);
    setResultInfo(null);
    setError(null);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-6">
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">{subtitle}</p>
      </div>

      {/* Upload state */}
      {!file && !uploading && (
        <ImageUploader onUpload={handleUpload} />
      )}

      {/* Uploading */}
      {uploading && (
        <div className="glass-card p-8 flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-2 border-primary-500 border-t-transparent animate-spin mb-4" />
          <p className="text-surface-300 mb-2">Uploading...</p>
          <div className="w-48 h-1.5 bg-surface-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <span className="text-xs text-surface-500 mt-1">{uploadProgress}%</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in">
          <span className="font-medium">Error:</span> {error}
        </div>
      )}

      {/* Loaded — show tool interface */}
      {file && fileId && info && !uploading && (
        <div className="space-y-6 animate-fade-in">
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-surface-400 truncate max-w-[200px]" title={file.name}>
                {file.name}
              </span>
              <span className="text-xs text-surface-600">|</span>
              <span className="text-xs text-surface-500 font-mono">
                {info.width}x{info.height}
              </span>
              <span className="text-xs text-surface-600">|</span>
              <span className="text-xs text-surface-500 font-mono">
                {info.file_size_str}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {resultFileId && (
                <button onClick={handleDownload} className="btn-primary text-sm flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download
                </button>
              )}
              <button onClick={handleReset} className="btn-secondary text-sm">
                New Image
              </button>
            </div>
          </div>

          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Preview area */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 gap-4">
                {/* Original */}
                <ImageViewer
                  src={getImageUrl(fileId)}
                  alt="Original"
                  className="h-[400px]"
                />

                {/* Result preview (if available) */}
                {resultFileId && (
                  <div className="animate-slide-up">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-sm font-medium text-green-400">Result</span>
                    </div>
                    <ImageViewer
                      src={getImageUrl(resultFileId)}
                      alt="Result"
                      className="h-[400px]"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar: controls + info */}
            <div className="space-y-4">
              {/* Tool controls */}
              <div className="glass-card p-5">
                {(() => {
                  const ToolComponent = children as any;
                  return (
                    <ToolComponent
                      file={file}
                      fileId={fileId}
                      imageUrl={getImageUrl(fileId)}
                      info={info}
                      resultFileId={resultFileId}
                      resultImageUrl={resultFileId ? getImageUrl(resultFileId) : null}
                      resultInfo={resultInfo}
                      setResult={setResult}
                      processing={processing}
                      setProcessing={setProcessing}
                      error={error}
                      setError={setError}
                    />
                  );
                })()}
              </div>

              {/* Image info */}
              <ImageInfoPanel info={info} label="Original" />

              {/* Result info */}
              {resultInfo && (
                <div className="animate-slide-up">
                  <ImageInfoPanel info={resultInfo} label="Result" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
