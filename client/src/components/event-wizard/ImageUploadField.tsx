import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import { uploadImage, type UploadFolder } from '@/lib/upload-api';

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
  folder,
  previewSize = 'md',
  aspectRatio = 'square',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32',
  };

  const aspectClasses = {
    square: 'aspect-square',
    wide: 'aspect-video',
    auto: '',
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum 5MB.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const url = await uploadImage(file, folder);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClear = () => {
    onChange('');
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {value ? (
        <div className="flex items-start gap-3">
          <div className={`relative ${sizeClasses[previewSize]} ${aspectClasses[aspectRatio]} overflow-hidden rounded-lg border bg-muted flex-shrink-0`}>
            <img
              src={value}
              alt="Preview"
              className="h-full w-full object-cover"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-1 -right-1 h-5 w-5"
              onClick={handleClear}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            <span>Image uploaded</span>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Change image'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader size="sm" className="mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </>
            )}
          </Button>

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          <p className="text-xs text-muted-foreground">
            Max 5MB. JPG, PNG, or GIF
          </p>
        </div>
      )}
    </div>
  );
};
