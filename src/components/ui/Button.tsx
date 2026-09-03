import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', isLoading, icon, children, ...props }, ref) => {
    
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:opacity-50 disabled:pointer-events-none";
    
    const variants = {
      primary: "bg-primary text-brand-primary-fg hover:bg-[#E5B011] active:bg-[#CC9C0F] border border-transparent font-semibold",
      secondary: "bg-surface-subtle border border-border-default text-text-primary hover:bg-surface-hover",
      ghost: "bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-interactive transition-all duration-300",
      outline: "bg-surface-primary border-2 border-primary text-text-primary hover:bg-primary hover:text-brand-primary-fg transition-all duration-300"
    };

    const sizes = "h-10 px-4 py-2 text-sm"; // Standard size

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes, className)}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            {icon && <span className="mr-2">{icon}</span>}
            {children}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
