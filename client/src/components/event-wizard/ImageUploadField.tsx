import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Loader } from '@/components/ui/loader';

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  previewSize?: 'sm' | 'md' | 'lg';
  aspectRatio?: 'square' | 'wide' | 'auto';
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  value,
  onChange,
  placeholder = 'https://...',
  previewSize = 'md',
  aspectRatio = 'square',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return;
    }

    // Validate file size (max 2MB for profile pics / logos)
    if (file.size > 2 * 1024 * 1024) {
      return;
    }

    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onChange(base64String);
        setIsUploading(false);
        setShowUrlInput(false);
      };
      reader.onerror = () => {
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    onChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowUrlInput(false);
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
            >
              Change image
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex-1"
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
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-muted-foreground"
            >
              <ImageIcon className="h-4 w-4 mr-1" />
              URL
            </Button>
          </div>

          {showUrlInput && (
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="text-sm"
            />
          )}

          <p className="text-xs text-muted-foreground">
            Max 2MB. JPG, PNG, or GIF
          </p>
        </div>
      )}
    </div>
  );
};
