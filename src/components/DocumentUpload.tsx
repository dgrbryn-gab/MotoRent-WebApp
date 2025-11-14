import { useState, useRef } from 'react';
import { Upload, X, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

// Utility function for class names
const cn = (...classes: (string | boolean | undefined | null)[]) => {
  return classes.filter(Boolean).join(' ');
};

interface DocumentUploadProps {
  onUpload: (file: File) => Promise<void>;
  acceptedTypes?: string[];
  maxSizeMB?: number;
  documentType: 'driver-license' | 'valid-id';
  existingFileUrl?: string;
  disabled?: boolean;
}

export function DocumentUpload({
  onUpload,
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
  maxSizeMB = 5,
  documentType,
  existingFileUrl,
  disabled = false
}: DocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(existingFileUrl || null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const documentLabel = documentType === 'driver-license' ? "Driver's License" : 'Valid ID';

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return 'Invalid file type. Please upload JPG, PNG, or PDF files only.';
    }

    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      return `File size exceeds ${maxSizeMB}MB limit.`;
    }

    return null;
  };

  const handleFileSelect = (file: File) => {
    setError(null);
    setUploadSuccess(false);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      setPreview('pdf');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Simulate progress (since Supabase doesn't provide upload progress)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await onUpload(selectedFile);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadSuccess(true);
      
      // Reset after success
      setTimeout(() => {
        setUploadSuccess(false);
        setUploadProgress(0);
      }, 3000);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.message || 'Upload failed. Please try again.');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreview(existingFileUrl || null);
    setError(null);
    setUploadSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBrowse = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card
        className={cn(
          'border-2 border-dashed transition-colors',
          isDragging && 'border-primary bg-primary/5',
          error && 'border-destructive',
          uploadSuccess && 'border-green-500 bg-green-50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="p-6">
          {/* Preview or Drop Zone */}
          {preview && preview !== 'pdf' ? (
            <div className="relative">
              <img
                src={preview}
                alt="Document preview"
                className="w-full h-48 object-contain rounded-lg bg-muted"
              />
              {!disabled && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleRemove}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ) : preview === 'pdf' ? (
            <div className="relative">
              <div className="flex flex-col items-center justify-center h-48 bg-muted rounded-lg">
                <FileText className="w-16 h-16 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">{selectedFile?.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(selectedFile!.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              {!disabled && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleRemove}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <Upload className={cn(
                'w-12 h-12 mb-4',
                isDragging ? 'text-primary' : 'text-muted-foreground'
              )} />
              <p className="text-sm font-medium text-foreground mb-2">
                Upload {documentLabel}
              </p>
              <p className="text-xs text-muted-foreground text-center mb-4">
                Drag and drop your file here or click to browse
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={handleBrowse}
                disabled={disabled}
              >
                Browse Files
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                Accepted: JPG, PNG, PDF (Max {maxSizeMB}MB)
              </p>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes.join(',')}
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled}
          />

          {/* Upload Progress */}
          {uploading && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Uploading...</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload Button */}
          {selectedFile && !uploading && !uploadSuccess && !existingFileUrl && (
            <Button
              type="button"
              className="w-full mt-4"
              onClick={handleUpload}
              disabled={disabled}
            >
              Upload {documentLabel}
            </Button>
          )}

          {/* Success Message */}
          {uploadSuccess && (
            <div className="flex items-center gap-2 text-green-600 mt-4 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5" />
              <p className="text-sm font-medium">Upload successful!</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-destructive mt-4 p-3 bg-destructive/10 rounded-lg">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
