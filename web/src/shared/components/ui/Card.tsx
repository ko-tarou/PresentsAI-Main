import { forwardRef, type HTMLAttributes } from "react";
import { clsx } from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds a hover elevation transition (use for clickable cards). */
  interactive?: boolean;
}

/** Surface container styled with the `.card` token class. */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ interactive, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx(
        "card",
        interactive && "cursor-pointer transition-shadow hover:shadow-card-hover",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
Card.displayName = "Card";
