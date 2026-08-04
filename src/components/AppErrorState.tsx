import React from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface AppErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  icon?: React.ReactNode;
}

export function AppErrorState({
  title = "Something went wrong",
  description = "We encountered an unexpected error. Please try again.",
  onRetry,
  icon
}: AppErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-75 w-full">
      <div className="mb-4 text-gray-400">
        {icon || <AlertCircle className="w-12 h-12 opacity-50" />}
      </div>
      
      <h3 className="text-lg font-medium text-black dark:text-white mb-2">
        {title}
      </h3>
      
      <p className="text-sm text-gray-500 max-w-70 mb-6">
        {description}
      </p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-full font-medium hover:scale-105 transition-transform active:scale-95"
        >
          <RefreshCcw className="w-4 h-4" />
          Retry
        </button>
      )}
    </div>
  );
}
