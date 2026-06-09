import { forwardRef, type SelectHTMLAttributes } from "react";
import { clsx } from "clsx";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

/** Native select styled with the `.select` token class. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={clsx("select", className)} {...props}>
      {children}
    </select>
  ),
);
Select.displayName = "Select";
