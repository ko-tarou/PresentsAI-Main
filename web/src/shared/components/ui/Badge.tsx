import { clsx } from "clsx";
import type { ReactNode } from "react";

type BadgeVariant = "default" | "primary" | "success" | "warning" | "error" | "info";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-surface-muted text-content-secondary border border-border",
  primary: "bg-primary-50 text-primary-700 border border-primary-200",
  success: "bg-success-light text-success-dark border border-success/20",
  warning: "bg-warning-light text-warning-dark border border-warning/20",
  error:   "bg-error-light text-error-dark border border-error/20",
  info:    "bg-info-light text-info-dark border border-info/20",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span className={clsx("badge", variantClasses[variant], className)}>
      {children}
    </span>
  );
}
