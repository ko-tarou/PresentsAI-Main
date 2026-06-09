"use client";
import { useEffect, type ReactNode } from "react";
import { clsx } from "clsx";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Optional header title. Renders the standard header row with a close button. */
  title?: ReactNode;
  /** Secondary line under the title (e.g. the document name). */
  subtitle?: ReactNode;
  children: ReactNode;
  /** Tailwind max-width class for the panel. Defaults to `max-w-lg`. */
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClass: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

/**
 * Token-driven modal: a dimmed backdrop (`.modal-backdrop`) plus a surface
 * panel (`.modal-panel`). Closes on backdrop click and Escape. Replaces the
 * ad-hoc `fixed inset-0 bg-black/40 ... bg-white shadow-2xl` markup that was
 * duplicated across feature dialogs.
 */
export function Modal({ open, onClose, title, subtitle, children, size = "lg", className }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className={clsx("modal-panel", sizeClass[size], className)}
        onClick={(e) => e.stopPropagation()}
      >
        {title !== undefined && (
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div className="min-w-0">
              <h2 className="text-base font-bold text-content-primary">{title}</h2>
              {subtitle !== undefined && (
                <p className="mt-0.5 max-w-72 truncate text-xs text-content-secondary">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="閉じる"
              className="rounded-full p-1.5 text-content-tertiary transition-colors hover:bg-surface-muted hover:text-content-secondary"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
