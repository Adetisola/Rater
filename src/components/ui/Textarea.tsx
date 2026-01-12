import React from 'react';
import { cn } from '../../lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[120px] w-full rounded-xl border border-gray-200 bg-white px-4 py-3 ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:border-black focus-visible:ring-1 focus-visible:ring-black/10 disabled:cursor-not-allowed disabled:opacity-50 resize-y transition-all font-sans text-sm",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";
