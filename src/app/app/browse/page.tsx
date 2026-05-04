"use client";

import { Suspense } from 'react';
import BrowseContent from './BrowseContent';

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <BrowseContent />
    </Suspense>
  );
}
