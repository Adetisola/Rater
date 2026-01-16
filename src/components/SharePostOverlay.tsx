import { Copy } from 'lucide-react';

interface SharePostOverlayProps {
  onClose: () => void;
  postId: string;
}

export function SharePostOverlay({ onClose, postId }: SharePostOverlayProps) {
  const shareUrl = `http://rater.vercel.app/${postId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    // Could add toast here
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="w-full max-w-md bg-white rounded-[32px] p-10 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 text-center">
        
        <h2 className="text-2xl font-bold text-[#111111] mb-2">Share this Post</h2>
        <p className="text-sm text-gray-500 mb-2">Help others review or learn from this design.</p>
        <p className="text-xs text-[#FEC312] font-medium mb-8">Attribution is claimed by the submitter.</p>

        {/* URL Input */}
        <div className="flex items-center gap-2 border-2 border-[#111111] rounded-xl px-4 py-3 mb-6">
            <input 
                readOnly
                value={shareUrl}
                className="flex-1 bg-transparent text-sm text-gray-500 outline-none w-full"
            />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4 mb-8">
            <button 
                onClick={onClose}
                className="px-8 py-3 rounded-full text-sm font-bold text-[#111111] hover:bg-gray-50 transition-colors"
            >
                Close
            </button>
            <button 
                onClick={handleCopy}
                className="px-8 py-3 rounded-full text-sm font-bold text-[#111111] border-2 border-[#FEC312] hover:bg-[#FEC312]/10 transition-colors flex items-center gap-2"
            >
                Copy Link
            </button>
        </div>

        {/* Social Icons */}
        <div className="flex justify-center gap-6 mb-4">
            <button className="w-12 h-12 rounded-full border border-gray-100 flex items-center justify-center hover:scale-105 transition-transform">
                <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-6 h-6" alt="WhatsApp" />
            </button>
            <button className="w-12 h-12 rounded-lg bg-black text-white flex items-center justify-center hover:scale-105 transition-transform">
                <span className="font-bold text-xl">X</span>
            </button>
            <button className="w-12 h-12 rounded-lg bg-[#0077B5] text-white flex items-center justify-center hover:scale-105 transition-transform">
                <span className="font-bold text-xl">in</span>
            </button>
        </div>
        
        <p className="text-[10px] text-gray-400 italic">Shared posts are public.</p>

      </div>
    </div>
  );
}
