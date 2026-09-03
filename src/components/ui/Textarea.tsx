import React from 'react';
import { cn } from '../../lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { }

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[120px] w-full rounded-xl border border-input-border bg-input-bg text-text-primary px-4 py-3 ring-offset-canvas placeholder:text-input-placeholder focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-focus-ring/20 disabled:cursor-not-allowed disabled:opacity-50 resize-y transition-all font-sans text-sm",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";
