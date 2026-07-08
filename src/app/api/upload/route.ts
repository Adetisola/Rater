import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { uploadAsset } from '@/lib/cloudinary/service';

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate Request
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse FormData
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 3. Server-side Validation
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 8MB' }, { status: 400 });
    }

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      return NextResponse.json({ error: 'Unsupported file format' }, { status: 400 });
    }

    // 4. Convert File to Data URI for Cloudinary Node SDK
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const dataUri = `data:${file.type};base64,${buffer.toString('base64')}`;

    // 5. Upload via Cloudinary Service
    const folder = `rater/posts/${user.id}`;
    const mediaAsset = await uploadAsset(dataUri, folder, user.id);

    return NextResponse.json({ success: true, asset: mediaAsset }, { status: 200 });
  } catch (error: any) {
    console.error('API /upload error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const publicId = searchParams.get('public_id');
    
    if (!publicId) {
      return NextResponse.json({ error: 'Missing public_id' }, { status: 400 });
    }

    // Security check: ensure the user owns the asset being deleted
    // Cloudinary folders are 'rater/posts/{userId}/...'
    if (!publicId.startsWith(`rater/posts/${user.id}/`)) {
      return NextResponse.json({ error: 'Forbidden: You do not own this asset' }, { status: 403 });
    }

    const { deleteAsset } = await import('@/lib/cloudinary/service');
    const success = await deleteAsset(publicId);

    if (success) {
      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('API /upload DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
