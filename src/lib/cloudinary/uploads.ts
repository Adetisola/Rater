import type { MediaAsset } from '@/types';
import { supabase } from '../supabase/client';

export async function uploadMedia(file: File): Promise<MediaAsset> {
  const formData = new FormData();
  formData.append('file', file);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('You must be logged in to upload media');
  }

  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Upload failed');
  }

  return data.asset as MediaAsset;
}

export async function deleteMedia(publicId: string): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return false;

    const response = await fetch(`/api/upload?public_id=${encodeURIComponent(publicId)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
    });
    
    return response.ok;
  } catch (error) {
    console.error('Failed to delete media:', error);
    return false;
  }
}
