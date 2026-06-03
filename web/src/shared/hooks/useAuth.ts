"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@features/dashboard/stores/authStore";

export function useRequireAuth() {
  const { accessToken, hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (hasHydrated && !accessToken) {
      router.replace("/login");
    }
  }, [accessToken, hasHydrated, router]);

  return { isAuthenticated: !!accessToken, isReady: hasHydrated };
}
