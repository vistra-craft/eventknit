import { useRef, useState } from "react";
import { Upload, Pencil, User, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader } from "@/components/ui/loader";

interface AvatarUploadProps {
  currentAvatar?: string | null;
  onAvatarChange: (file: File, preview: string) => void;
  isUploading?: boolean;
  userName?: string;
  label?: string;
  hint?: string;
  /** When true, renders a rounded-lg square preview suitable for logos */
  isLogo?: boolean;
}

/**
 * Reusable Avatar / Logo Upload Component
 * - Square aspect ratio (1:1)
 * - Max 2MB
 * - Supports both circular profile photos and square company logos
 */
export function AvatarUpload({
  currentAvatar,
  onAvatarChange,
  isUploading = false,
  label = "Profile Photo",
  hint = "Your photo will be displayed on your profile and in event communications.",
  isLogo = false,
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentAvatar || null);
  const [error, setError] = useState<string>("");

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, or GIF)");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("File size must be less than 2MB");
      return;
    }

    setError("");

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
    onAvatarChange(new File([], ""), "");
  };

  const containerClass = isLogo
    ? "relative w-32 h-32 rounded-xl overflow-hidden border-2 border-border bg-muted"
    : "relative w-32 h-32 rounded-full overflow-hidden border-4 border-border bg-muted";

  const placeholderIcon = isLogo
    ? <Building2 className="w-12 h-12 text-muted-foreground" />
    : <User className="w-12 h-12 text-muted-foreground" />;

  return (
    <div className="space-y-4">
      <Label>{label}</Label>

      <div className="flex items-start gap-6">
        {/* Preview */}
        <div className="flex-shrink-0">
          <div className={containerClass}>
            {preview ? (
              <img
                src={preview}
                alt={isLogo ? "Logo preview" : "Avatar preview"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                {placeholderIcon}
              </div>
            )}

            {preview && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 shadow-md transition-all"
                title={isLogo ? "Change logo" : "Change photo"}
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Controls */}
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

            <div className="flex items-center gap-2">
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
                    <Upload className="w-4 h-4 mr-2" />
                    {isLogo ? "Upload Logo" : "Choose Photo"}
                  </>
                )}
              </Button>

              {preview && !isUploading && (
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

            <p className="text-xs text-muted-foreground">
              Max 2MB · JPG, PNG, or GIF
              {isLogo && " · Square format recommended"}
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <p className="text-xs text-muted-foreground leading-relaxed">{hint}</p>
        </div>
      </div>
    </div>
  );
}
