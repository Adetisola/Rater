import { create } from 'zustand';

interface NavigationState {
  postIds: string[];
  setNavigationContext: (postIds: string[]) => void;
  getNextPostId: (currentId: string) => string | null;
  getPrevPostId: (currentId: string) => string | null;
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  postIds: [],
  setNavigationContext: (postIds: string[]) => set({ postIds }),
  getNextPostId: (currentId: string) => {
    const { postIds } = get();
    const index = postIds.indexOf(currentId);
    if (index >= 0 && index < postIds.length - 1) {
      return postIds[index + 1];
    }
    return null;
  },
  getPrevPostId: (currentId: string) => {
    const { postIds } = get();
    const index = postIds.indexOf(currentId);
    if (index > 0) {
      return postIds[index - 1];
    }
    return null;
  }
}));
