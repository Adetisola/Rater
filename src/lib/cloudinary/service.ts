import { v2 as cloudinary } from 'cloudinary';
import type { MediaAsset } from '@/types';

// Initialize cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadAsset(
  buffer: Buffer,
  folder: string,
  ownerId: string
): Promise<MediaAsset> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        context: `owner=${ownerId}|post=draft`,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result) {
          reject(new Error("Upload result is undefined"));
          return;
        }
        
        resolve({
          id: crypto.randomUUID(),
          type: result.resource_type === 'video' ? 'video' : 'image',
          url: result.secure_url,
          public_id: result.public_id,
          width: result.width,
          height: result.height,
          aspect_ratio: result.width / result.height,
          format: result.format,
          bytes: result.bytes,
          order: 0,
        });
      }
    );
    
    uploadStream.end(buffer);
  });
}

export async function deleteAsset(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
}
