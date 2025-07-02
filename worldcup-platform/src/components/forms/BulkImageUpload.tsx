'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  X, 
  CheckCircle, 
  AlertCircle, 
  // Image as ImageIcon,
  Loader2,
  // FileImage,
  Trash2,
  RotateCcw,
  // Download
} from 'lucide-react';

interface UploadFile {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  title?: string;
  description?: string;
}

interface BulkImageUploadProps {
  onFilesUploaded: (files: { file: File; title: string; description?: string }[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  showTitleInput?: boolean;
  showDescriptionInput?: boolean;
  allowReorder?: boolean;
}

export default function BulkImageUpload({
  onFilesUploaded,
  maxFiles = 50,
  maxFileSize = 10,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  showTitleInput = true,
  showDescriptionInput = false,
  allowReorder: _allowReorder = true
}: BulkImageUploadProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Handle file selection
  const handleFiles = useCallback((files: FileList | File[]) => {
    const newFiles: UploadFile[] = [];
    
    Array.from(files).forEach((file, index) => {
      // Validate file type
      if (!acceptedTypes.includes(file.type)) {
        console.warn(`File ${file.name} is not a supported image type`);
        return;
      }

      // Validate file size
      if (file.size > maxFileSize * 1024 * 1024) {
        console.warn(`File ${file.name} exceeds ${maxFileSize}MB limit`);
        return;
      }

      // Check total files limit
      if (uploadFiles.length + newFiles.length >= maxFiles) {
        console.warn(`Maximum ${maxFiles} files allowed`);
        return;
      }

      const uploadFile: UploadFile = {
        id: `${Date.now()}_${index}`,
        file,
        preview: URL.createObjectURL(file),
        status: 'pending',
        progress: 0,
        title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
      };

      newFiles.push(uploadFile);
    });

    setUploadFiles(prev => [...prev, ...newFiles]);
  }, [uploadFiles.length, maxFiles, maxFileSize, acceptedTypes]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  // File input handler
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleFiles(files);
    }
    // Reset input
    e.target.value = '';
  }, [handleFiles]);

  // Remove file
  const removeFile = useCallback((id: string) => {
    setUploadFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  }, []);

  // Update file metadata
  const updateFileMetadata = useCallback((id: string, updates: Partial<Pick<UploadFile, 'title' | 'description'>>) => {
    setUploadFiles(prev => prev.map(file => 
      file.id === id ? { ...file, ...updates } : file
    ));
  }, []);

  // Simulate upload progress (replace with actual upload logic)
  const simulateUpload = useCallback(async (file: UploadFile): Promise<void> => {
    return new Promise((resolve, reject) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        
        setUploadFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, progress: Math.min(progress, 100) } : f
        ));

        if (progress >= 100) {
          clearInterval(interval);
          
          // Simulate random success/failure
          const success = Math.random() > 0.1; // 90% success rate
          
          setUploadFiles(prev => prev.map(f => 
            f.id === file.id ? { 
              ...f, 
              status: success ? 'success' : 'error',
              progress: 100,
              error: success ? undefined : 'Upload failed. Please try again.'
            } : f
          ));

          if (success) {
            resolve();
          } else {
            reject(new Error('Upload failed'));
          }
        }
      }, 100);
    });
  }, []);

  // Start upload process
  const startUpload = useCallback(async () => {
    const pendingFiles = uploadFiles.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setIsUploading(true);
    
    // Update all pending files to uploading status
    setUploadFiles(prev => prev.map(file => 
      file.status === 'pending' ? { ...file, status: 'uploading' } : file
    ));

    try {
      // Upload files concurrently (limit to 3 at a time)
      const batchSize = 3;
      for (let i = 0; i < pendingFiles.length; i += batchSize) {
        const batch = pendingFiles.slice(i, i + batchSize);
        await Promise.allSettled(batch.map(file => simulateUpload(file)));
        
        // Update overall progress
        const completed = Math.min(i + batchSize, pendingFiles.length);
        setUploadProgress((completed / pendingFiles.length) * 100);
      }

      // Call callback with successful uploads
      const successfulFiles = uploadFiles
        .filter(f => f.status === 'success')
        .map(f => ({
          file: f.file,
          title: f.title || f.file.name,
          description: f.description
        }));

      if (successfulFiles.length > 0) {
        onFilesUploaded(successfulFiles);
      }

    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [uploadFiles, onFilesUploaded, simulateUpload]);

  // Clear all files
  const clearAll = useCallback(() => {
    uploadFiles.forEach(file => URL.revokeObjectURL(file.preview));
    setUploadFiles([]);
  }, [uploadFiles]);

  // Retry failed uploads
  const retryFailed = useCallback(() => {
    setUploadFiles(prev => prev.map(file => 
      file.status === 'error' ? { ...file, status: 'pending', progress: 0, error: undefined } : file
    ));
  }, []);

  const successCount = uploadFiles.filter(f => f.status === 'success').length;
  const errorCount = uploadFiles.filter(f => f.status === 'error').length;
  const pendingCount = uploadFiles.filter(f => f.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
          ${isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="space-y-4">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${isDragging ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <Upload className={`w-8 h-8 ${isDragging ? 'text-blue-600' : 'text-gray-600'}`} />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">
              {isDragging ? '파일을 여기에 놓으세요' : '이미지 파일을 업로드하세요'}
            </h3>
            <p className="text-gray-600 mb-4">
              최대 {maxFiles}개 파일, 각각 {maxFileSize}MB 이하
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              파일 선택
            </button>
          </div>

          <div className="text-sm text-gray-500">
            지원 형식: {acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')}
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="font-medium">업로드 중...</span>
            <span className="text-sm text-gray-600">{uploadProgress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 rounded-full h-2 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload Summary */}
      {uploadFiles.length > 0 && (
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-4 text-sm">
            <span>총 {uploadFiles.length}개 파일</span>
            {successCount > 0 && (
              <span className="text-green-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                {successCount}개 성공
              </span>
            )}
            {errorCount > 0 && (
              <span className="text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errorCount}개 실패
              </span>
            )}
            {pendingCount > 0 && (
              <span className="text-blue-600">
                {pendingCount}개 대기
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {errorCount > 0 && (
              <button
                onClick={retryFailed}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <RotateCcw className="w-4 h-4" />
                재시도
              </button>
            )}
            <button
              onClick={clearAll}
              className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              전체 삭제
            </button>
            {pendingCount > 0 && (
              <button
                onClick={startUpload}
                disabled={isUploading}
                className="bg-emerald-600 text-white px-4 py-2 rounded text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                업로드 시작
              </button>
            )}
          </div>
        </div>
      )}

      {/* File List */}
      {uploadFiles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {uploadFiles.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white border rounded-lg overflow-hidden shadow-sm"
              >
                {/* Image Preview */}
                <div className="relative aspect-video bg-gray-100">
                  <img
                    src={file.preview}
                    alt={file.title || file.file.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Status Overlay */}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    {file.status === 'uploading' && (
                      <div className="text-white text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        <div className="text-sm">{file.progress.toFixed(0)}%</div>
                      </div>
                    )}
                    {file.status === 'success' && (
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    )}
                    {file.status === 'error' && (
                      <AlertCircle className="w-8 h-8 text-red-500" />
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFile(file.id)}
                    className="absolute top-2 right-2 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* File Info */}
                <div className="p-3 space-y-2">
                  {showTitleInput && (
                    <input
                      type="text"
                      value={file.title || ''}
                      onChange={(e) => updateFileMetadata(file.id, { title: e.target.value })}
                      placeholder="제목 입력..."
                      className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                  
                  {showDescriptionInput && (
                    <textarea
                      value={file.description || ''}
                      onChange={(e) => updateFileMetadata(file.id, { description: e.target.value })}
                      placeholder="설명 입력..."
                      rows={2}
                      className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{(file.file.size / 1024 / 1024).toFixed(1)}MB</span>
                    <span>{file.file.type}</span>
                  </div>

                  {file.error && (
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      {file.error}
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                {file.status === 'uploading' && (
                  <div className="h-1 bg-gray-200">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}