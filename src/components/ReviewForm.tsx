import { useState } from 'react';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { StarRating } from './ui/StarRating';

interface ReviewFormProps {
  onSubmit: (ratings: { clarity: number; purpose: number; aesthetics: number }, comment: string) => void;
}

export function ReviewForm({ onSubmit }: ReviewFormProps) {
  const [clarity, setClarity] = useState(0);
  const [purpose, setPurpose] = useState(0);
  const [aesthetics, setAesthetics] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate average for display
  const currentAverage = ((clarity + purpose + aesthetics) / 3).toFixed(1);
  const isComplete = clarity > 0 && purpose > 0 && aesthetics > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete) return;
    
    setIsSubmitting(true);
    // Simulate network delay
    setTimeout(() => {
        onSubmit({ clarity, purpose, aesthetics }, comment);
        setIsSubmitting(false);
        // Reset form or close overlay logic typically handled by parent
    }, 800);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
      <h3 className="font-bold text-lg mb-4">Rate this design</h3>
      
      <div className="space-y-4 mb-6">
        {/* CLARITY */}
        <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Clarity</span>
            <StarRating rating={clarity} onChange={setClarity} interactive />
        </div>

        {/* PURPOSE */}
        <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Purpose</span>
            <StarRating rating={purpose} onChange={setPurpose} interactive />
        </div>

        {/* AESTHETICS */}
        <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Aesthetics</span>
            <StarRating rating={aesthetics} onChange={setAesthetics} interactive />
        </div>
      </div>

      <div className="mb-4">
         <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-semibold uppercase text-gray-500">Comment (Optional)</label>
            {isComplete && (
                <span className="text-xs font-bold text-brand">Avg: {currentAverage}</span>
            )}
         </div>
         <Textarea 
            placeholder="What worked? What didn't?" 
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="bg-white min-h-[80px]"
         />
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={!isComplete || isSubmitting}
        isLoading={isSubmitting}
      >
        Submit Review
      </Button>
    </form>
  );
}
