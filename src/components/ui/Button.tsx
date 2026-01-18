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
    
    const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none";
    
    const variants = {
      primary: "bg-primary text-black hover:bg-[#E5B011] active:bg-[#CC9C0F] border border-transparent shadow-sm",
      secondary: "bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50",
      ghost: "bg-transparent text-muted hover:text-gray-900 hover:bg-gray-100",
      outline: "bg-white border-2 border-[#FEC312] text-black hover:bg-[#FEC312] hover:text-white transition-all duration-300"
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
