import { forwardRef, type TextareaHTMLAttributes } from "react";
import { clsx } from "clsx";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

/** Multiline text input styled with the `.textarea` token class. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={clsx("textarea", className)} {...props} />
  ),
);
Textarea.displayName = "Textarea";
