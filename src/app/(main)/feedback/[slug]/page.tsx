import { FeedbackDetail } from '@/components/feedback/FeedbackDetail';

export const metadata = {
  title: 'Feedback Request - Rater',
  description: 'View community feedback discussion and official development updates.',
  robots: {
    index: false,
    follow: false,
  },
};

interface PageProps {
  params: Promise<{ slug: string }> | { slug: string };
}

export default async function FeedbackDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  return <FeedbackDetail slug={resolvedParams.slug} />;
}
