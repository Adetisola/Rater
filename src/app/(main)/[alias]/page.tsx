import { getProfileByUsername } from '@/lib/profiles';
import { notFound, redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { ProfileView } from '@/components/ProfileView';

export async function generateMetadata({ params }: { params: Promise<{ alias: string }> }) {
  const { alias } = await params;
  const decodedAlias = decodeURIComponent(alias);
  
  if (!decodedAlias.startsWith('@')) {
    return { title: 'Not Found' };
  }

  const slug = decodedAlias.slice(1).toLowerCase();
  const profile = await getProfileByUsername(slug);

  if (!profile) {
    return { title: 'Profile Not Found' };
  }

  const displayName = profile.name || `@${profile.username}`;
  const title = `${displayName} (@${profile.username})`;
  const description = profile.bio
    ? profile.bio
    : `View ${displayName}'s design work and critiques on Rater.`;
  const canonicalPath = `/@${profile.username}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: `${title} — Rater`,
      description,
      url: `https://www.raterapp.site${canonicalPath}`,
      type: "profile",
      // Use the profile's avatar if available, otherwise fall back to site OG image
      ...(profile.avatar_url
        ? {
            images: [
              {
                url: profile.avatar_url,
                alt: displayName,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary",
      title: `${title} — Rater`,
      description,
    },
  };
}


export default async function PremiumAvatarPage({ params }: { params: Promise<{ alias: string }> }) {
  const { alias } = await params;
  const decodedAlias = decodeURIComponent(alias);

  if (!decodedAlias.startsWith('@')) {
    notFound();
  }

  const slug = decodedAlias.slice(1).toLowerCase();
  const profile = await getProfileByUsername(slug);
  
  if (!profile) {
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .contains('previous_usernames', [slug])
      .limit(1)
      .maybeSingle();

    if (data) {
      redirect(`/@${data.username}`);
    } else {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center p-8 bg-white">
          <h2 className="text-2xl font-semibold mb-3 text-black">This profile doesn’t exist.</h2>
          <p className="text-gray-500">Omo bro, you don lost 😂</p>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen w-full bg-white flex flex-col font-sans text-black">
      <div className="flex-1 w-full pt-4">
        <ProfileView avatarId={profile.id} initialProfile={profile} />
      </div>
    </div>
  );
}
