import { useState } from 'react';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { StarRating } from './ui/StarRating';
import { Input } from './ui/Input';

interface ReviewFormProps {
  onSubmit: (ratings: { clarity: number; purpose: number; aesthetics: number }, comment: string, reviewerName: string) => void;
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
      <h3 className="font-bold text-xl mb-8">Drop a Review</h3>
      
      <div className="space-y-4 mb-8">
        {/* CLARITY */}
        <div className="flex items-center justify-between">
            <span className="text-base font-medium text-[#111111] border-b-2 border-dotted border-gray-300 pb-0.5 cursor-help">Clarity</span>
            <StarRating rating={clarity} onChange={setClarity} interactive size="lg" />
        </div>

        {/* PURPOSE */}
        <div className="flex items-center justify-between">
            <span className="text-base font-medium text-[#111111] border-b-2 border-dotted border-gray-300 pb-0.5 cursor-help">Purpose</span>
            <StarRating rating={purpose} onChange={setPurpose} interactive size="lg" />
        </div>

        {/* AESTHETICS */}
        <div className="flex items-center justify-between">
            <span className="text-base font-medium text-[#111111] border-b-2 border-dotted border-gray-300 pb-0.5 cursor-help">Aesthetics</span>
            <StarRating rating={aesthetics} onChange={setAesthetics} interactive size="lg" />
        </div>
      </div>

      <div className="space-y-4 mb-8">
         <Input 
            placeholder="Your name (Optional)" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 rounded-xl border-gray-200"
         />

         <Textarea 
            placeholder="Comment..." 
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[120px] rounded-xl border-gray-200 resize-none p-4"
         />
      </div>

      <Button 
        type="submit" 
        className="w-full h-12 rounded-full text-base font-bold" 
        variant="outline"
        disabled={!isComplete || isSubmitting}
        isLoading={isSubmitting}
      >
        Rate
      </Button>
    </form>
  );
}
