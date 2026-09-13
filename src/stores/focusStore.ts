import { create } from 'zustand';

interface FocusState {
  focusTaskId: string | null;
  openFocus: (taskId: string) => void;
  closeFocus: () => void;
}

export const useFocusStore = create<FocusState>()((set) => ({
  focusTaskId: null,
  openFocus: (taskId) => set({ focusTaskId: taskId }),
  closeFocus: () => set({ focusTaskId: null }),
}));
