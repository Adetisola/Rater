import { ConnectedAccounts } from '@/components/ConnectedAccounts';

export const metadata = {
  title: 'Settings - Rater',
};

export default function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Settings</h1>
      
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm mb-8">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Connected Accounts</h2>
        <p className="text-gray-600 mb-6">Manage the accounts you use to sign in to Rater.</p>
        
        <ConnectedAccounts />
      </div>

      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Account Preferences</h2>
        <p className="text-gray-600 mb-6">Settings and preferences configuration will be available here soon.</p>
        
        <div className="space-y-4">
          <div className="p-4 border border-gray-100 rounded-2xl bg-gray-50/50">
            <h3 className="font-bold text-gray-800">Email Notifications</h3>
            <p className="text-sm text-gray-500 mt-1">Manage your email notification preferences.</p>
          </div>
          <div className="p-4 border border-gray-100 rounded-2xl bg-gray-50/50">
            <h3 className="font-bold text-gray-800">Theme</h3>
            <p className="text-sm text-gray-500 mt-1">Light, Dark, or System preference.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
