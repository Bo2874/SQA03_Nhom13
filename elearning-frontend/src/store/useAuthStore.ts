import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface IAuth {
  token: string;
  refreshToken: string;
}

// ⚠️ MOCK MODE: Set to true to use mock authentication
const MOCK_MODE = true;

// Mock tokens for testing
const MOCK_TOKENS: IAuth = {
  token: "mock-access-token-for-testing",
  refreshToken: "mock-refresh-token-for-testing",
};

const initialState: IAuth = MOCK_MODE ? MOCK_TOKENS : {
  token: "",
  refreshToken: "",
};

interface IAuthAction {
  setNewToken: (auth: Omit<IAuth, "userInfo">) => void;
  logoutUser: () => void;
}

export const useAuthStore = create<IAuth & IAuthAction>()(
  persist(
    immer((set) => ({
      ...initialState,
      setNewToken: ({ token, refreshToken }) => {
        set((state) => {
          state.token = token;
          state.refreshToken = refreshToken;
        });
      },
      logoutUser: () => set(() => initialState),
    })),
    {
      name: "auth",
    }
  )
);
