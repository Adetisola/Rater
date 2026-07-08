"use client";

import { useState } from 'react';
import { LegalModal } from './LegalModal';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [legalModal, setLegalModal] = useState<{ isOpen: boolean; title: string; docUrl: string }>({
    isOpen: false,
    title: '',
    docUrl: ''
  });

  const openLegal = (title: string, docUrl: string) => {
    setLegalModal({ isOpen: true, title, docUrl });
  };
  
  return (
    <footer className="w-full py-8 mt-auto flex flex-col items-center justify-center gap-2">
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] font-medium text-gray-400">
        <span className="tracking-widest">Rater ©{currentYear}. All Rights Reserved.</span>
        <span className="hidden sm:inline text-gray-300">•</span>
        <button onClick={() => openLegal('Terms of Service', '/legal/Rater Terms of Service.md')} className="hover:text-black transition-colors uppercase tracking-wider">Terms</button>
        <span className="text-gray-300">•</span>
        <button onClick={() => openLegal('Privacy Policy', '/legal/Rater Privacy Policy.md')} className="hover:text-black transition-colors uppercase tracking-wider">Privacy</button>
        <span className="text-gray-300">•</span>
        <button onClick={() => openLegal('Community Guidelines', '/legal/Rater Community Guidelines.md')} className="hover:text-black transition-colors uppercase tracking-wider">Community</button>
        <span className="text-gray-300">•</span>
        <button onClick={() => openLegal('AI & Insights Policy', '/legal/Rater AI & Insights Policy.md')} className="hover:text-black transition-colors uppercase tracking-wider">AI Policy</button>
      </div>

      <LegalModal
        isOpen={legalModal.isOpen}
        onClose={() => setLegalModal(prev => ({ ...prev, isOpen: false }))}
        title={legalModal.title}
        docUrl={legalModal.docUrl}
      />
    </footer>
  );
}

