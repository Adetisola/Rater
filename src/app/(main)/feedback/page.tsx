import { FeedbackBoard } from '@/components/feedback/FeedbackBoard';

export const metadata = {
  title: 'Product Feedback & Roadmap - Rater',
  description: 'Help us shape the future of Rater. Request features, improvements, report bugs, and follow development.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function FeedbackPage() {
  return (
    <div className="w-full max-w-4xl mx-auto py-4 sm:py-10 px-3.5 sm:px-6 overflow-x-clip min-w-0">
      <FeedbackBoard />
    </div>
  );
}
