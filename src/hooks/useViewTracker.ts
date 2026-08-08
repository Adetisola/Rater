import { useEffect, useRef, useCallback } from 'react';
import { useInView } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';

export function useViewTracker(postId: string, onIncrement?: () => void) {
    const viewState = useRef<'idle' | 'pending' | 'completed'>('idle');
    const containerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, { amount: 0.5 }); // 50% visibility

    const trackView = useCallback(async (trigger: 'viewport' | 'action') => {
        if (viewState.current !== 'idle') return;
        viewState.current = 'pending';

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const headers: Record<string, string> = {};
            if (session?.access_token) {
                headers['Authorization'] = `Bearer ${session.access_token}`;
            }

            const res = await fetch(`/api/posts/${postId}/view`, {
                method: 'POST',
                headers,
                keepalive: true, // Crucial for reliability during page unloads
            });
            const data = await res.json();
            
            if (data.incremented) {
                if (onIncrement) onIncrement();
            }
            viewState.current = 'completed';
        } catch (err) {
            console.error("Failed to record view", err);
            viewState.current = 'idle'; // Reset on error so it can retry
        }
    }, [postId, onIncrement]);

    // Viewport tracker
    useEffect(() => {
        let timer: NodeJS.Timeout;

        // If the component becomes 50% visible, start a 2-second timer
        if (isInView && viewState.current === 'idle') {
            timer = setTimeout(() => {
                // Check document visibility so background tabs don't trigger views
                if (document.visibilityState === 'visible' && viewState.current === 'idle') {
                    trackView('viewport');
                }
            }, 2000);
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [isInView, trackView]);

    // Handle tab visibility changes returning to an active tab
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && isInView && viewState.current === 'idle') {
                trackView('viewport');
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isInView, trackView]);

    return { trackView, containerRef };
}
