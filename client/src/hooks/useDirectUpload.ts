import { useState, useCallback } from 'react';
import { apiPost } from '@/lib/api';
import type { UploadFolder } from '@/lib/upload-api';

interface SignResponse {
  success: boolean;
  data: {
    timestamp: number;
    signature: string;
    apiKey: string;
    cloudName: string;
    folder: string;
    transformation: string;
  };
}

interface UseDirectUploadOptions {
  folder?: UploadFolder;
  maxSizeMB?: number;
  onSuccess?: (url: string) => void;
  onError?: (message: string) => void;
}

interface UseDirectUploadReturn {
  upload: (file: File) => Promise<string | null>;
  progress: number;       // 0–100
  isUploading: boolean;
  error: string | null;
  reset: () => void;
}

/**
 * Signed direct upload to Cloudinary.
 * 1. Fetches a short-lived signature from /api/v1/uploads/sign
 * 2. Posts the file directly to Cloudinary's API with XHR (for progress)
 * 3. Returns the secure URL
 */
export function useDirectUpload({
  folder = 'general',
  maxSizeMB = 5,
  onSuccess,
  onError,
}: UseDirectUploadOptions = {}): UseDirectUploadReturn {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setProgress(0);
    setIsUploading(false);
    setError(null);
  }, []);

  const upload = useCallback(
    async (file: File): Promise<string | null> => {
      if (!file.type.startsWith('image/')) {
        const msg = 'Only image files are allowed';
        setError(msg);
        onError?.(msg);
        return null;
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        const msg = `File too large. Maximum ${maxSizeMB}MB.`;
        setError(msg);
        onError?.(msg);
        return null;
      }

      setIsUploading(true);
      setProgress(0);
      setError(null);

      try {
        // 1. Get signature from our server
        const signRes = await apiPost<SignResponse>('/uploads/sign', { folder });
        if (!signRes.success) throw new Error('Failed to get upload signature');
        const { timestamp, signature, apiKey, cloudName, transformation } = signRes.data;

        // 2. Build FormData for Cloudinary
        const fd = new FormData();
        fd.append('file', file);
        fd.append('api_key', apiKey);
        fd.append('timestamp', String(timestamp));
        fd.append('signature', signature);
        fd.append('folder', signRes.data.folder);
        fd.append('transformation', transformation);

        // 3. Upload directly to Cloudinary with XHR for progress
        const url = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setProgress(Math.round((e.loaded / e.total) * 100));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const result = JSON.parse(xhr.responseText) as { secure_url: string };
              resolve(result.secure_url);
            } else {
              const errBody = JSON.parse(xhr.responseText) as { error?: { message?: string } };
              reject(new Error(errBody.error?.message || 'Cloudinary upload failed'));
            }
          };

          xhr.onerror = () => reject(new Error('Network error during upload'));
          xhr.onabort = () => reject(new Error('Upload cancelled'));

          xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
          xhr.send(fd);
        });

        setProgress(100);
        onSuccess?.(url);
        return url;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        setError(msg);
        onError?.(msg);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [folder, maxSizeMB, onSuccess, onError],
  );

  return { upload, progress, isUploading, error, reset };
}
