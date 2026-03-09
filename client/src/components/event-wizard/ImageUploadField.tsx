import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, X, ImageIcon } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import { useDirectUpload } from '@/hooks/useDirectUpload';
import type { UploadFolder } from '@/lib/upload-api';

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  folder?: UploadFolder;
  previewSize?: 'sm' | 'md' | 'lg';
  aspectRatio?: 'square' | 'wide' | 'auto';
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  value,
  onChange,
  folder = 'general',
  previewSize = 'md',
  aspectRatio = 'square',
}) => {
  const { upload, progress, isUploading, error } = useDirectUpload({
    folder,
    maxSizeMB: 5,
  });

  const handleFile = useCallback(
    async (file: File) => {
      const url = await upload(file);
      if (url) onChange(url);
    },
    [upload, onChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    disabled: isUploading,
    onDropAccepted: ([file]) => handleFile(file),
    noClick: !!value,
  });

  const sizeClasses = { sm: 'h-16 w-16', md: 'h-24 w-24', lg: 'h-32 w-32' };
  const aspectClasses = { square: 'aspect-square', wide: 'aspect-video', auto: '' };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      {value ? (
        <div className="flex items-start gap-3">
          <div
            className={`relative ${sizeClasses[previewSize]} ${aspectClasses[aspectRatio]} overflow-hidden rounded-lg border bg-muted flex-shrink-0`}
          >
            <img src={value} alt="Preview" className="h-full w-full object-cover" />
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-1 -right-1 h-5 w-5"
              onClick={() => onChange('')}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            <span>Image uploaded</span>
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                disabled={isUploading}
                type="button"
              >
                {isUploading ? `Uploading ${progress}%…` : 'Change image'}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border hover:border-primary/50 hover:bg-muted/30'
          }`}
        >
          <input {...getInputProps()} />

          {isUploading ? (
            <>
              <Loader size="sm" className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Uploading… {progress}%</p>
              <div className="w-24 h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          ) : isDragActive ? (
            <>
              <Upload className="h-6 w-6" />
              <p className="text-sm font-medium">Drop image here</p>
            </>
          ) : (
            <>
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drag & drop or{' '}
                <span className="text-primary font-medium">browse</span>
              </p>
              <p className="text-xs text-muted-foreground">Max 5MB · JPG, PNG, GIF</p>
            </>
          )}
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};
