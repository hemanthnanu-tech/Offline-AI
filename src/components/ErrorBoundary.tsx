import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] p-6 text-center">
          <div className="bg-red-500/10 p-4 rounded-full mb-6">
            <AlertTriangle className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Something went wrong</h1>
          <p className="text-[var(--text-muted)] mb-8 max-w-md">
            The application encountered an unexpected error. Your chat history should still be safely stored locally.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-[var(--accent-fg)] rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              <RefreshCcw className="w-4 h-4" />
              Reload Application
            </button>
          </div>
          {this.state.error && (
            <pre className="mt-8 p-4 bg-black/5 dark:bg-white/5 rounded-lg text-left text-xs text-red-600 dark:text-red-400 max-w-2xl overflow-auto border border-red-500/20">
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
