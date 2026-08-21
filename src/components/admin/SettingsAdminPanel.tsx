"use client";

import { useState, useEffect } from 'react';
import { 
  Megaphone, 
  UserPlus, 
  MessageSquare, 
  Save, 
  Check, 
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getPlatformSettings, updatePlatformSetting } from '@/lib/admin/server';

export function SettingsAdminPanel() {
  const [settings, setSettings] = useState<Record<string, any>>({
    maintenance_banner: { enabled: false, message: '' },
    signup_enabled: { enabled: true },
    feedback_enabled: { enabled: true },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        const data = await getPlatformSettings();
        const map: Record<string, any> = {};
        data.forEach(item => {
          map[item.key] = item.value;
        });
        setSettings(prev => ({ ...prev, ...map }));
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleSaveSetting = async (key: string) => {
    try {
      setIsSaving(key);
      setSavedSuccess(null);
      await updatePlatformSetting(key, settings[key]);
      setSavedSuccess(key);
      setTimeout(() => setSavedSuccess(null), 2500);
    } catch (err: any) {
      alert(err?.message || 'Failed to save setting');
    } finally {
      setIsSaving(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
          Platform Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Global platform controls, announcement banners, and registration switches.
        </p>
      </div>

      {isLoading ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center text-gray-400 text-sm">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-gray-300" />
          Loading platform configurations...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Announcement / Maintenance Banner */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Megaphone size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Announcement & Maintenance Banner</h2>
                  <p className="text-xs text-gray-500">Displays a dismissible notification bar across the top of all public pages.</p>
                </div>
              </div>

              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(settings.maintenance_banner?.enabled)}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    maintenance_banner: {
                      ...prev.maintenance_banner,
                      enabled: e.target.checked,
                    }
                  }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 block">Banner Message</label>
              <textarea
                value={settings.maintenance_banner?.message || ''}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  maintenance_banner: {
                    ...prev.maintenance_banner,
                    message: e.target.value,
                  }
                }))}
                placeholder="e.g. 🛠️ We're performing scheduled server optimizations from 2:00 AM - 3:00 AM UTC."
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3.5 text-xs font-medium focus:outline-none focus:border-black h-20 resize-none"
              />
            </div>

            <div className="flex items-center justify-end">
              <Button
                variant="primary"
                onClick={() => handleSaveSetting('maintenance_banner')}
                disabled={isSaving === 'maintenance_banner'}
                className="h-9 px-4 text-xs font-bold rounded-xl inline-flex items-center gap-1.5"
              >
                {savedSuccess === 'maintenance_banner' ? (
                  <>
                    <Check size={14} />
                    Saved!
                  </>
                ) : isSaving === 'maintenance_banner' ? (
                  'Saving...'
                ) : (
                  <>
                    <Save size={14} />
                    Save Banner
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Registration / Sign-up Control */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <UserPlus size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">User Registrations</h2>
                <p className="text-xs text-gray-500">Allow new users to sign up and create public profiles on Rater.</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(settings.signup_enabled?.enabled)}
                  onChange={async (e) => {
                    const val = { enabled: e.target.checked };
                    setSettings(prev => ({ ...prev, signup_enabled: val }));
                    await updatePlatformSetting('signup_enabled', val);
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
              </label>
            </div>
          </div>

          {/* Feedback Submission Control */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <MessageSquare size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Community Feedback Portal</h2>
                <p className="text-xs text-gray-500">Allow users to submit new feature requests and product feedback ideas.</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(settings.feedback_enabled?.enabled)}
                  onChange={async (e) => {
                    const val = { enabled: e.target.checked };
                    setSettings(prev => ({ ...prev, feedback_enabled: val }));
                    await updatePlatformSetting('feedback_enabled', val);
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
