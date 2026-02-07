import { useRef, useState } from "react";
import { Upload, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader } from "@/components/ui/loader";

interface AvatarUploadProps {
  currentAvatar?: string | null;
  onAvatarChange: (file: File, preview: string) => void;
  isUploading?: boolean;
  userName?: string;
}

/**
 * Reusable Avatar Upload Component
 * Consistent with event image upload pattern but optimized for avatars
 * - Square aspect ratio (1:1)
 * - Smaller file size (2MB max)
 * - Direct preview without focal point picker
 */
export function AvatarUpload({
  currentAvatar,
  onAvatarChange,
  isUploading = false,
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentAvatar || null);
  const [error, setError] = useState<string>("");

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, or GIF)");
      return;
    }

    // Validate file size (max 2MB for avatars)
    if (file.size > 2 * 1024 * 1024) {
      setError("Avatar size must be less than 2MB");
      return;
    }

    setError("");

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPreview(base64String);
      onAvatarChange(file, base64String);
    };
    reader.onerror = () => {
      setError("Failed to read image file");
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setPreview(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // Notify parent that avatar was removed
    onAvatarChange(new File([], ""), "");
  };

  return (
    <div className="space-y-4">
      <Label>Profile Photo</Label>

      <div className="flex items-start gap-6">
        {/* Avatar Display */}
        <div className="flex-shrink-0">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-border bg-muted">
            {preview ? (
              <img
                src={preview}
                alt="Avatar preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <User className="w-12 h-12 text-muted-foreground" />
              </div>
            )}

            {/* Remove Button */}
            {preview && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={isUploading}
                className="absolute top-2 right-2 p-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Upload Controls */}
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="hidden"
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full sm:w-auto"
            >
              {isUploading ? (
                <>
                  <Loader size="sm" className="mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Photo
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground">
              Max 2MB. JPG, PNG, or GIF
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <p className="text-xs text-muted-foreground leading-relaxed">
            Your photo will be displayed on your profile and in event communications.
          </p>
        </div>
      </div>
    </div>
  );
}
