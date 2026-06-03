import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  setTokens: (access: string, refresh: string) => void;
  clearTokens: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      userId: null,
      setTokens: (access, refresh) => {
        try {
          const payload = JSON.parse(atob(access.split(".")[1]));
          set({ accessToken: access, refreshToken: refresh, userId: payload.sub as string });
        } catch {
          set({ accessToken: access, refreshToken: refresh, userId: null });
        }
      },
      clearTokens: () =>
        set({ accessToken: null, refreshToken: null, userId: null }),
    }),
    { name: "presentsai-auth" }
  )
);
