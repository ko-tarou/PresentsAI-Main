"use client";
import { clsx } from "clsx";

// A labeled group of controls with a centered caption underneath (PowerPoint style)
export function RibbonGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center px-2">
      <div className="flex flex-1 items-center gap-0.5">{children}</div>
      <span className="mt-0.5 text-[10px] leading-none text-content-tertiary">{label}</span>
    </div>
  );
}

export function RibbonDivider() {
  return <div className="mx-1 my-1.5 w-px self-stretch bg-border" />;
}

// Large button: icon on top, label under (e.g. 貼り付け, 新しいスライド)
export function RibbonBigButton({
  icon, label, onClick, active, disabled, title,
}: { icon: React.ReactNode; label: string; onClick?: () => void; active?: boolean; disabled?: boolean; title?: string }) {
  return (
    <button onClick={onClick} disabled={disabled} title={title ?? label}
      className={clsx(
        "flex h-full min-w-14 flex-col items-center justify-center gap-1 rounded-md px-2 py-1 text-content-secondary transition-colors",
        active ? "bg-primary-100 text-primary-700" : "hover:bg-surface-muted hover:text-content-primary",
        disabled && "pointer-events-none opacity-40"
      )}>
      <span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span>
      <span className="text-[11px] leading-tight text-center max-w-16">{label}</span>
    </button>
  );
}

// Small icon button (compact, for dense groups like font/paragraph)
export function RibbonIconButton({
  icon, onClick, active, disabled, title,
}: { icon: React.ReactNode; onClick?: () => void; active?: boolean; disabled?: boolean; title: string }) {
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      className={clsx(
        "flex h-7 w-7 items-center justify-center rounded transition-colors",
        active ? "bg-primary-100 text-primary-700" : "text-content-secondary hover:bg-surface-muted hover:text-content-primary",
        disabled && "pointer-events-none opacity-40"
      )}>
      <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>
    </button>
  );
}
