import { API_BASE_URL } from './api';

export type UploadFolder = 'avatars' | 'speakers' | 'exhibitors' | 'sponsors' | 'events';

/**
 * Upload an image to Cloudinary via the generic upload endpoint.
 * Returns the secure Cloudinary URL.
 */
export async function uploadImage(file: File, folder?: UploadFolder): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);
  if (folder) formData.append('folder', folder);

  const res = await fetch(`${API_BASE_URL}/uploads/image`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
    },
    body: formData,
  });

  if (res.status === 401) {
    localStorage.removeItem('accessToken');
    window.location.href = '/auth/signin?reason=session_expired';
    throw new Error('Your session has expired. Please sign in again.');
  }

  const json = await res.json();

  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Image upload failed');
  }

  return json.data.url;
}
