import { useEffect, useRef, useCallback } from 'react';
import { useInView } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';

export interface UseViewTrackerOptions {
    amount?: 'some' | 'all' | number;
}

export function useViewTracker(
    postId: string, 
    onIncrement?: () => void,
    options?: UseViewTrackerOptions
) {
    const viewState = useRef<'idle' | 'pending' | 'completed'>('idle');
    const containerRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(containerRef, { amount: options?.amount ?? 0.2 });
    const onIncrementRef = useRef(onIncrement);

    useEffect(() => {
        onIncrementRef.current = onIncrement;
    }, [onIncrement]);

    const trackView = useCallback(async (_trigger: 'viewport' | 'action') => {
        if (!postId || postId === 'undefined') return;
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

            if (!res.ok) {
                viewState.current = 'idle';
                return;
            }

            const data = await res.json().catch(() => null);
            if (!data) {
                viewState.current = 'idle';
                return;
            }
            
            if (data.incremented) {
                if (onIncrementRef.current) onIncrementRef.current();
            }
            viewState.current = 'completed';
        } catch (err) {
            console.error("Failed to record view", err);
            viewState.current = 'idle'; // Reset on error so it can retry
        }
    }, [postId]);

    // Strict Viewport & Tab Visibility Tracker
    useEffect(() => {
        let timer: NodeJS.Timeout;

        const startTimer = () => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
                if (document.visibilityState === 'visible' && viewState.current === 'idle') {
                    trackView('viewport');
                }
            }, 2000);
        };

        const stopTimer = () => {
            if (timer) clearTimeout(timer);
        };

        // Initial check when `isInView` or dependencies change
        if (isInView && document.visibilityState === 'visible' && viewState.current === 'idle') {
            startTimer();
        } else {
            stopTimer();
        }

        // Handle tab visibility changes (canceling if hidden, restarting if visible)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && isInView && viewState.current === 'idle') {
                startTimer();
            } else {
                stopTimer();
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            stopTimer();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isInView, trackView]);

    return { trackView, containerRef };
}
