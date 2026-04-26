import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { User } from "@/@types/User.type";

interface AppState {
  profile: User | null;
  _hasHydrated: boolean;
  setProfile: (profile: User) => void;
  clearProfile: () => void;
  setHasHydrated: (state: boolean) => void;
}

const initialProfileState: User | null = null;

const initialState: AppState = {
  profile: initialProfileState,
  _hasHydrated: false,
  setProfile: () => {},
  clearProfile: () => {},
  setHasHydrated: () => {},
};

export const useAppStore = create<AppState>()(
  persist(
    immer((set) => ({
      ...initialState,
      setProfile: (profile: User) => {
        set((state) => {
          state.profile = profile;
        });
      },
      clearProfile: () => {
        set((state) => {
          state.profile = null;
        });
      },
      setHasHydrated: (state: boolean) => {
        set((draft) => {
          draft._hasHydrated = state;
        });
      },
    })),
    {
      name: "app",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
