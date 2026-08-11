export const metadata = {
  title: 'Feedback',
  description: 'Help us improve Rater by sharing your feedback.',
  robots: {
    index: false,
    follow: false,
  },
};

import { FeedbackBoard } from '@/components/feedback/FeedbackBoard';

export default function FeedbackPage() {
  return (
    <div className="max-w-5xl mx-auto py-8 sm:py-12 px-4 sm:px-6">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Product Feedback</h1>
          <p className="text-gray-500 mt-2">Help us shape the future of Rater. Request features, report bugs, or share general thoughts.</p>
        </div>
      </div>

      <FeedbackBoard />
    </div>
  );
}
