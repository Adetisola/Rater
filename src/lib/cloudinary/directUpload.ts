import type { MediaAsset } from '@/types';

/**
 * Uploads a file directly to Cloudinary using an unsigned upload preset,
 * bypassing Vercel's serverless function payload limit (4.5MB).
 * Tracks real upload progress via XMLHttpRequest.
 */
export async function uploadDirectToCloudinary(
  file: File,
  onProgress?: (percent: number) => void
): Promise<MediaAsset> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary environment variables are missing');
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded * 100) / e.total);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve({
            id: response.public_id,
            type: 'image',
            url: response.secure_url,
            public_id: response.public_id,
            width: response.width,
            height: response.height,
            aspect_ratio: response.width && response.height ? response.width / response.height : 1,
            format: response.format || 'webp',
            bytes: response.bytes || 0,
            order: 0,
          });
        } catch (err) {
          reject(new Error('Failed to parse Cloudinary response'));
        }
      } else {
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          reject(new Error(errorResponse.error?.message || `Cloudinary upload failed with status ${xhr.status}`));
        } catch {
          // If response isn't JSON
          if (xhr.status === 400) {
            reject(new Error('Invalid image format or file rejected by Cloudinary.'));
          } else if (xhr.status === 413) {
            reject(new Error('That image is too large for Cloudinary. Please compress it and try again.'));
          } else {
            reject(new Error(`Cloudinary upload failed with status ${xhr.status}`));
          }
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during upload. Please check your connection.'));
    };

    xhr.send(formData);
  });
}
