"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthActions } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Loader2, AlertCircle } from 'lucide-react';

export function ConnectedAccounts() {
  const { connectGoogle } = useAuthActions();
  const [identities, setIdentities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    async function loadIdentities() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (user) {
          setIdentities(user.identities || []);
        }
      } catch (err: any) {
        console.error("Failed to load identities:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadIdentities();
  }, []);

  const handleConnectGoogle = async () => {
    setIsConnecting(true);
    setError(null);
    const result = await connectGoogle();
    if (!result.ok) {
      setError(result.error || "Failed to connect Google account");
      setIsConnecting(false);
    }
  };

  const googleIdentity = identities.find(id => id.provider === 'google');
  const isOnlyGoogle = googleIdentity && identities.length === 1;

  if (isLoading) {
    return (
      <div className="flex justify-center p-6">
        <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Google Connection */}
      <div className="p-4 sm:p-5 border border-gray-100 rounded-2xl bg-white flex items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-base sm:text-lg font-medium text-gray-800 flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span className="truncate">Google Account</span>
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-relaxed">
            {googleIdentity ? `Connected as ${googleIdentity.identity_data?.email}` : 'Sign in across devices with Google.'}
          </p>
        </div>
        
        <div className="shrink-0">
          {googleIdentity ? (
            <Button
              variant="outline"
              disabled={isOnlyGoogle}
              title={isOnlyGoogle ? "You must have a password set to disconnect Google." : "Disconnect Google"}
              className="h-9 px-4 text-xs sm:text-[13px] font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 border-gray-200 rounded-full whitespace-nowrap shrink-0"
              onClick={async () => {
                if (isOnlyGoogle) return;
                setIsConnecting(true);
                const { error } = await supabase.auth.unlinkIdentity(googleIdentity);
                if (error) {
                  setError(error.message);
                } else {
                  setIdentities(prev => prev.filter(id => id.id !== googleIdentity.id));
                }
                setIsConnecting(false);
              }}
            >
              Disconnect
            </Button>
          ) : (
            <Button
              variant="secondary"
              onClick={handleConnectGoogle}
              isLoading={isConnecting}
              disabled={isConnecting}
              className="h-9 px-5 text-xs sm:text-[13px] font-semibold rounded-full whitespace-nowrap shrink-0"
            >
              Connect
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
