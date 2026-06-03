"use client";
import { useRequireAuth } from "@shared/hooks/useAuth";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useRequireAuth();
  if (!isAuthenticated) return null;
  return <>{children}</>;
}
