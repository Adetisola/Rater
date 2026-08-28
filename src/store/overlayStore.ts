import { create } from 'zustand';
import type { FeedbackType } from '@/types';

interface OverlayState {
  isFeedbackDrawerOpen: boolean;
  defaultFeedbackType: FeedbackType;
  openFeedbackDrawer: (options?: { defaultType?: FeedbackType }) => void;
  closeFeedbackDrawer: () => void;
}

export const useOverlayStore = create<OverlayState>((set) => ({
  isFeedbackDrawerOpen: false,
  defaultFeedbackType: 'Feature Request',
  openFeedbackDrawer: (options) =>
    set({
      isFeedbackDrawerOpen: true,
      defaultFeedbackType: options?.defaultType || 'Feature Request',
    }),
  closeFeedbackDrawer: () =>
    set({
      isFeedbackDrawerOpen: false,
    }),
}));
