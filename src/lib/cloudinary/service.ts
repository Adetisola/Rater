import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';
import type { MediaAsset } from '@/types';

// Initialize cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadAsset(
  fileDataUri: string,
  folder: string,
  ownerId: string
): Promise<MediaAsset> {
  const result: UploadApiResponse = await cloudinary.uploader.upload(fileDataUri, {
    folder,
    context: `owner=${ownerId}|post=draft`,
    resource_type: 'auto',
  });

  return {
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
  };
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
