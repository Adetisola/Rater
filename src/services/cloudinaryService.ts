import type { ServiceResponse } from './baseService';

export const cloudinaryService = {
  /**
   * Uploads an image file directly to Cloudinary using an unsigned upload preset.
   * This is secure for public client assets and eliminates server-side proxy overhead.
   */
  async uploadImage(file: File): Promise<ServiceResponse<string>> {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UNSIGNED_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      console.warn('⚠️ Cloudinary configuration missing. Returning mock CDN URL.');
      
      // Graceful fallback for development runs if Cloudinary variables are unpopulated
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ok: true,
            data: 'https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&q=80&w=800',
            error: null,
          });
        }, 1200);
      });
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Cloudinary API Error:', errorData);
        return {
          ok: false,
          data: null,
          error: errorData.error?.message || 'Failed to upload image to media host.',
        };
      }

      const responseData = await response.json();
      
      // Ensure we extract the secure HTTPS absolute URL
      const secureUrl = responseData.secure_url;

      if (!secureUrl) {
        return {
          ok: false,
          data: null,
          error: 'Media host returned an invalid asset URL response.',
        };
      }

      return {
        ok: true,
        data: secureUrl,
        error: null,
      };
    } catch (err: any) {
      console.error('Cloudinary Upload Exception:', err);
      return {
        ok: false,
        data: null,
        error: err.message || 'An unexpected error occurred during asset upload.',
      };
    }
  }
};
