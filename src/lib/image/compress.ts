/**
 * Image Compression Utility
 * Client-side resizing and compression to prevent hitting Vercel payload limits.
 */

export async function compressImage(file: File): Promise<File> {
  // Only process standard images
  if (!file.type.startsWith('image/')) {
    return file;
  }
  // Skip SVGs and GIFs as canvas breaks animations/vector data
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file;
  }

  const MAX_DIMENSION = 2560;
  const SIZE_THRESHOLD = 3.5 * 1024 * 1024; // 3.5MB

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      
      // Cap dimensions
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      // If no resize needed and file is under threshold, skip compression to save CPU/quality
      if (width === img.width && height === img.height && file.size <= SIZE_THRESHOLD) {
        resolve(file);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      // Optional: fill white background for transparent images converting to lossy formats
      // But we want to preserve PNG transparency if possible. 
      // If we convert to WebP, WebP supports transparency.
      ctx.drawImage(img, 0, 0, width, height);

      // If original file is huge, force conversion to WebP at 85% for massive savings
      // Otherwise keep original mime type (but still resize)
      let targetMimeType = file.type;
      let quality: number | undefined = undefined;

      if (file.size > SIZE_THRESHOLD || file.type === 'image/bmp') {
        targetMimeType = 'image/webp';
        quality = 0.85;
      } else if (file.type === 'image/jpeg' || file.type === 'image/webp') {
        quality = 0.90; // High quality resize for already-compressed formats
      }

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          
          // If compression somehow made it larger (common with small PNGs), and we didn't resize, return original
          if (blob.size >= file.size && width === img.width && height === img.height) {
            resolve(file);
            return;
          }

          // Generate new filename
          const extMap: Record<string, string> = {
            'image/webp': '.webp',
            'image/jpeg': '.jpg',
            'image/png': '.png',
          };
          const ext = extMap[targetMimeType] || '';
          const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
          const newFileName = ext ? `${baseName}${ext}` : file.name;

          const compressedFile = new File([blob], newFileName, {
            type: targetMimeType,
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        targetMimeType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file); // Fallback to original
    };

    img.src = objectUrl;
  });
}
