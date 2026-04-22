import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Pencil, User, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader } from '@/components/ui/loader';
import { useDirectUpload } from '@/hooks/useDirectUpload';

interface AvatarUploadProps {
  currentAvatar?: string | null;
  /** Called with the Cloudinary URL once the upload completes. */
  onUploadComplete: (url: string) => void;
  /** Called when the user removes the current image. */
  onRemove?: () => void;
  label?: string;
  hint?: string;
  /** When true, renders a rounded-lg square preview suitable for logos */
  isLogo?: boolean;
  /** Controls the image dimensions. Defaults to 'md' (128px). */
  size?: 'sm' | 'md';
}

/**
 * Avatar / Logo Upload — direct Cloudinary upload via signed params.
 * Supports drag-and-drop and click-to-select.
 * Max 2MB.
 */
export function AvatarUpload({
  currentAvatar,
  onUploadComplete,
  onRemove,
  label = 'Profile Photo',
  hint = 'Your photo will be displayed on your profile and in event communications.',
  isLogo = false,
  size = 'md',
}: AvatarUploadProps) {
  const sizeClass = size === 'sm' ? 'w-20 h-20' : 'w-32 h-32';
  const [preview, setPreview] = useState<string | null>(currentAvatar || null);
  const [errorMsg, setErrorMsg] = useState('');

  const { upload, progress, isUploading, error: uploadError } = useDirectUpload({
    folder: 'avatars',
    maxSizeMB: 2,
    onError: (msg) => setErrorMsg(msg),
  });

  const handleFile = useCallback(
    async (file: File) => {
      setErrorMsg('');
      // Instant local preview
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      const url = await upload(file);
      // Revoke the temp object URL once Cloudinary URL is ready
      URL.revokeObjectURL(objectUrl);

      if (url) {
        setPreview(url);
        onUploadComplete(url);
      } else {
        // Upload failed — revert preview
        setPreview(currentAvatar || null);
      }
    },
    [upload, onUploadComplete, currentAvatar],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
    disabled: isUploading,
    onDropAccepted: ([file]) => handleFile(file),
    onDropRejected: () => setErrorMsg('Only image files are allowed (max 2MB)'),
    maxSize: 2 * 1024 * 1024,
    noClick: !!preview, // when preview shown, clicking the edit button handles it
  });

  const handleRemove = () => {
    setPreview(null);
    setErrorMsg('');
    onRemove?.();
  };

  const containerClass = isLogo
    ? `relative ${sizeClass} rounded-xl overflow-hidden border-2 border-border bg-muted`
    : `relative ${sizeClass} rounded-full overflow-hidden border-4 border-border bg-muted`;

  const displayError = errorMsg || uploadError;

  return (
    <div className="space-y-4">
      <Label>{label}</Label>

      <div className="flex items-start gap-6">
        {/* Avatar preview + dropzone overlay when no preview */}
        <div className="flex-shrink-0">
          {preview ? (
            <div className={containerClass}>
              <img
                src={preview}
                alt={isLogo ? 'Logo preview' : 'Avatar preview'}
                className="w-full h-full object-cover"
              />
              {/* Progress overlay */}
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1">
                  <Loader size="sm" className="text-white" />
                  <span className="text-white text-xs font-medium">{progress}%</span>
                </div>
              )}
              {!isUploading && (
                <div {...getRootProps()} className="absolute inset-0 cursor-pointer">
                  <input {...getInputProps()} />
                  <button
                    type="button"
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-all"
                    title={isLogo ? 'Change logo' : 'Change photo'}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={`${containerClass} cursor-pointer transition-colors ${
                isDragActive ? 'ring-2 ring-primary ring-offset-2 bg-primary/5' : 'hover:bg-muted/80'
              }`}
            >
              <input {...getInputProps()} />
              <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                {isLogo ? (
                  <Building2 className="w-10 h-10 text-muted-foreground" />
                ) : (
                  <User className="w-10 h-10 text-muted-foreground" />
                )}
                {isDragActive && (
                  <span className="text-[10px] text-primary font-medium">Drop here</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex-1 space-y-3">
          <div className="space-y-2">
            {isUploading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader size="sm" />
                <span>Uploading… {progress}%</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div {...getRootProps()}>
                  <input {...getInputProps()} />
                  <Button type="button" variant="outline" size="sm" disabled={isUploading}>
                    {isLogo ? 'Upload Logo' : 'Choose Photo'}
                  </Button>
                </div>
                {preview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemove}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    Remove
                  </Button>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Drag & drop or click to upload · Max 2MB · JPG, PNG, GIF
              {isLogo && ' · Square format recommended'}
            </p>
          </div>

          {displayError && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <p className="text-sm text-destructive">{displayError}</p>
            </div>
          )}

          <p className="text-xs text-muted-foreground leading-relaxed">{hint}</p>
        </div>
      </div>
    </div>
  );
}
