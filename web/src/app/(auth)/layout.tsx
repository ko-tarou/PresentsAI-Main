"use client";
import { useRequireAuth } from "@shared/hooks/useAuth";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isReady } = useRequireAuth();
  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-subtle">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }
  if (!isAuthenticated) return null;
  return <>{children}</>;
}
