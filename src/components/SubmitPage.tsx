"use client";

import { useRouter } from 'next/navigation';
import { PostForm } from './PostForm';

export function SubmitPage() {
  const router = useRouter();

  const handleSuccess = () => {
    window.dispatchEvent(new Event('app-navigation-start'));
    router.push('/app/browse');
  };

  return <PostForm onSuccess={handleSuccess} />;
}
