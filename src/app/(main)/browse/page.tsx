"use client";

import { Suspense } from 'react';
import BrowseContent from '@/components/BrowseContent';

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <BrowseContent />
    </Suspense>
  );
}
