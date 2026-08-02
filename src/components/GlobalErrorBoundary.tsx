"use client";

import React, { Component, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { normalizeError } from '@/lib/errors/normalizeError';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // We normalize and log the error here
    normalizeError(error, {
      fallbackCode: 'RATER_FATAL_001',
      fallbackMessage: 'A fatal rendering error occurred.',
      context: { errorInfo }
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[9999] bg-white dark:bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Oops. Something unexpected happened.
          </h1>
          
          <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
            We've encountered a fatal error and have logged the issue. Please reload the page to continue.
          </p>
          
          <button
            onClick={this.handleReload}
            className="flex items-center gap-2 px-8 py-3.5 bg-black dark:bg-white text-white dark:text-black rounded-full font-bold hover:scale-105 transition-transform active:scale-95"
          >
            <RefreshCw className="w-5 h-5" />
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
