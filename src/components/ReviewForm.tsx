import { useState } from 'react';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { StarRating } from './ui/StarRating';
import { Input } from './ui/Input';

interface ReviewFormProps {
  onSubmit: (ratings: { clarity: number; purpose: number; aesthetics: number }, comment: string, reviewerName: string) => void;
}

const CRITERIA_INFO = {
  Clarity: {
    question: "How clear, readable, and well structured is the design?",
    points: ["Hierarchy", "Spacing", "Readability", "Layout Balance"]
  },
  Purpose: {
    question: "How well does the design communicate it's intended message or goal?",
    points: ["Brand Fit", "UX intent", "Conversion Clarity", "Context Alignment"]
  },
  Aesthetics: {
    question: "How visually appealing and polished is the design?",
    points: ["Colour Usage", "Typography", "Style Consistency", "Overall Look & Feel"]
  }
};

function CriteriaLabel({ label, info }: { label: string, info: { question: string, points: string[] } }) {
  return (
    <div className="relative group cursor-help">
      <span className="text-base font-medium text-[#111111] border-b-2 border-dotted border-gray-300 pb-0.5 transition-colors group-hover:border-black group-hover:text-black">
        {label}
      </span>
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-4 bg-[#111111] text-white text-xs rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none transform translate-y-2 group-hover:translate-y-0">
        {/* Arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#111111]" />
        
        <p className="font-semibold mb-2.5 leading-relaxed text-white">{info.question}</p>
        <ul className="space-y-1.5 text-gray-300">
          {info.points.map(point => (
            <li key={point} className="flex items-start gap-2">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-white/60 shrink-0" />
              {point}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function ReviewForm({ onSubmit }: ReviewFormProps) {
  const [clarity, setClarity] = useState(0);
  const [purpose, setPurpose] = useState(0);
  const [aesthetics, setAesthetics] = useState(0);
  const [comment, setComment] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate average for display
  const isComplete = clarity > 0 && purpose > 0 && aesthetics > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete) return;
    
    setIsSubmitting(true);
    // Simulate network delay
    setTimeout(() => {
        onSubmit({ clarity, purpose, aesthetics }, comment, name || 'Anonymous');
        setIsSubmitting(false);
    }, 800);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
      <h3 className="font-bold text-xl mb-8">Rate this Design</h3>
      
      <div className="space-y-4 mb-8">
        {/* CLARITY */}
        <div className="flex items-center justify-between">
            <CriteriaLabel label="Clarity" info={CRITERIA_INFO.Clarity} />
            <StarRating rating={clarity} onChange={setClarity} interactive size="lg" />
        </div>

        {/* PURPOSE */}
        <div className="flex items-center justify-between">
            <CriteriaLabel label="Purpose" info={CRITERIA_INFO.Purpose} />
            <StarRating rating={purpose} onChange={setPurpose} interactive size="lg" />
        </div>

        {/* AESTHETICS */}
        <div className="flex items-center justify-between">
            <CriteriaLabel label="Aesthetics" info={CRITERIA_INFO.Aesthetics} />
            <StarRating rating={aesthetics} onChange={setAesthetics} interactive size="lg" />
        </div>
      </div>

      <div className="space-y-4 mb-8">
         <Input 
            placeholder="Your name (or be Anonymous)" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 rounded-xl border-gray-200"
         />

         <div className="relative">
             <Textarea 
                placeholder="Comment..." 
                value={comment}
                onChange={(e) => {
                    if (e.target.value.length <= 200) {
                        setComment(e.target.value);
                    }
                }}
                maxLength={200}
                className="min-h-[120px] rounded-xl border-gray-200 resize-none p-4 pb-8"
             />
             <div className={`absolute bottom-3 right-4 text-xs transition-colors font-medium pointer-events-none ${
                 comment.length >= 200 ? 'text-red-500' : 'text-gray-400'
             }`}>
                 {comment.length} / 200
             </div>
         </div>
      </div>

      <Button 
        type="submit" 
        className="w-22 h-12 rounded-full text-xl font-semibold" 
        variant="outline"
        disabled={!isComplete || isSubmitting}
        isLoading={isSubmitting}
      >
        Rate
      </Button>
    </form>
  );
}
