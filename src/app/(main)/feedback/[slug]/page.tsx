import { FeedbackDetail } from '@/components/feedback/FeedbackDetail';

export const metadata = {
  title: 'Feedback Detail - Rater',
};

interface PageProps {
  params: { slug: string };
}

export default function FeedbackDetailPage({ params }: PageProps) {
  return <FeedbackDetail slug={params.slug} />;
}
