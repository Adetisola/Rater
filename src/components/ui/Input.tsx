import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full h-12 px-4 rounded-xl border border-input-border bg-input-bg text-text-primary ring-offset-canvas file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-input-placeholder focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-focus-ring/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all font-sans text-sm",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
