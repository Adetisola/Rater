import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Settings',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SettingsPage() {
  redirect('/browse?settings=true');
}
