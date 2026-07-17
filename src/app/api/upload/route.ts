import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { uploadAsset } from '@/lib/cloudinary/service';

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB

/**
 * Always returns JSON — never HTML error pages.
 * This prevents the "Unexpected token 'R'" client-side parse error.
 */
function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate Request
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonError('Unauthorized', 401);
    }
    const token = authHeader.split(' ')[1];
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return jsonError('Unauthorized', 401);
    }

    // 2. Parse FormData
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return jsonError('Invalid request body', 400);
    }

    const file = formData.get('file') as File | null;
    
    if (!file) {
      return jsonError('No file provided', 400);
    }

    // 3. Server-side Validation
    if (file.size > MAX_FILE_SIZE) {
      return jsonError('File size exceeds 8MB limit', 400);
    }

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      return jsonError('Unsupported file format. Only images and videos are accepted.', 400);
    }

    // 4. Convert File to Buffer for Cloudinary upload_stream
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 5. Upload via Cloudinary Service
    const folder = `rater/posts/${user.id}`;
    const mediaAsset = await uploadAsset(buffer, folder, user.id);

    return NextResponse.json({ success: true, asset: mediaAsset }, { status: 200 });
  } catch (error: any) {
    console.error('API /upload POST error:', error);
    // NEVER return a raw error.message directly — it may contain internal info.
    // Inspect the error to give an appropriate HTTP status.
    const msg = error?.message ?? '';
    if (msg.includes('too large') || msg.includes('size')) {
      return jsonError('File too large (max 8MB)', 400);
    }
    return jsonError('An internal error occurred. Please try again.', 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonError('Unauthorized', 401);
    }
    const token = authHeader.split(' ')[1];
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return jsonError('Unauthorized', 401);
    }

    const { searchParams } = new URL(req.url);
    const publicId = searchParams.get('public_id');
    
    if (!publicId) {
      return jsonError('Missing public_id', 400);
    }

    // Security check: ensure the user owns the asset being deleted
    if (!publicId.startsWith(`rater/posts/${user.id}/`)) {
      return jsonError('Forbidden: You do not own this asset', 403);
    }

    const { deleteAsset } = await import('@/lib/cloudinary/service');
    const success = await deleteAsset(publicId);

    if (success) {
      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      return jsonError('Failed to delete asset', 500);
    }
  } catch (error: any) {
    console.error('API /upload DELETE error:', error);
    return jsonError('An internal error occurred.', 500);
  }
}
