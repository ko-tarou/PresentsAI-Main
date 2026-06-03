import { clsx } from "clsx";

interface AvatarProps {
  name?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const COLORS = [
  "bg-primary-100 text-primary-700",
  "bg-success/20 text-success-dark",
  "bg-warning/20 text-warning-dark",
  "bg-info/20 text-info-dark",
  "bg-error/20 text-error-dark",
];

function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function Avatar({ name = "?", size = "md", className }: AvatarProps) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const sizeClass = {
    xs: "h-6 w-6 text-xs",
    sm: "h-8 w-8 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-10 w-10 text-base",
  }[size];

  return (
    <div className={clsx("inline-flex items-center justify-center rounded-full font-semibold", sizeClass, colorForName(name), className)}>
      {initials || "?"}
    </div>
  );
}
