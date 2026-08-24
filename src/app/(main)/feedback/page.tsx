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
    <div className="max-w-4xl mx-auto py-6 sm:py-10 px-4 sm:px-6">
      <FeedbackBoard />
    </div>
  );
}
