"use client";
import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { clsx } from "clsx";

interface PopoverProps {
  /** The trigger element. Receives onClick + ref via render or as a normal node wrapped in a button. */
  trigger: (props: { open: boolean; toggle: () => void; ref: (el: HTMLElement | null) => void }) => ReactNode;
  children: ReactNode | ((close: () => void) => ReactNode);
  align?: "left" | "right";
  className?: string;
}

export function Popover({ trigger, children, align = "left", className }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((o) => !o), []);

  const setRef = useCallback((el: HTMLElement | null) => { triggerRef.current = el; }, []);

  // Position the panel under the trigger
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const left = align === "right" ? rect.right : rect.left;
    setCoords({ top: rect.bottom + 4, left });
  }, [open, align]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      {trigger({ open, toggle, ref: setRef })}
      {open && coords && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              position: "fixed",
              top: coords.top,
              left: align === "right" ? undefined : coords.left,
              right: align === "right" ? `calc(100vw - ${coords.left}px)` : undefined,
              zIndex: 1000,
            }}
            className={clsx("rounded-xl border border-border bg-surface shadow-modal", className)}
          >
            {typeof children === "function" ? children(close) : children}
          </div>,
          document.body
        )}
    </>
  );
}
