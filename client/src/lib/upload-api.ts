import { apiPost } from './api';

export type UploadFolder = 'avatars' | 'speakers' | 'exhibitors' | 'sponsors' | 'events';

interface UploadResponse {
  success: boolean;
  data: { url: string };
  message?: string;
}

/**
 * Upload a document (image or PDF) for verification/KYC.
 * Returns the secure Cloudinary URL.
 */
export async function uploadDocument(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiPost<UploadResponse>('/uploads/document', formData);
  if (!response.success || !response.data?.url) {
    throw new Error(response.message || 'Document upload failed');
  }
  return response.data.url;
}

/**
 * Upload an image to Cloudinary via the generic upload endpoint.
 * Returns the secure Cloudinary URL.
 */
export async function uploadImage(file: File, folder?: UploadFolder): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  if (folder) formData.append('folder', folder);

  const response = await apiPost<UploadResponse>('/uploads/image', formData);

  if (!response.success || !response.data?.url) {
    throw new Error(response.message || 'Image upload failed');
  }

  return response.data.url;
}
