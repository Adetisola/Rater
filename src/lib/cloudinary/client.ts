/**
 * Cloudinary Client — Infrastructure Layer
 *
 * TODO(milestone-3): Configure the Cloudinary SDK.
 *
 * import { v2 as cloudinary } from 'cloudinary';
 * cloudinary.config({
 *   cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
 *   api_key:    process.env.CLOUDINARY_API_KEY,
 *   api_secret: process.env.CLOUDINARY_API_SECRET,
 *   secure: true,
 * });
 *
 * Nothing outside lib/cloudinary/ should know Cloudinary exists.
 * All image operations go through lib/cloudinary/uploads.ts and transforms.ts.
 */

export const cloudinaryConfig = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '',
};
