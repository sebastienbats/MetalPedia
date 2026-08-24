'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🔥 MetalPedia Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="text-7xl mb-4 animate-pulse">⚰️</div>
          <h2 className="font-metal text-3xl text-metal-rust mb-2">The Beast Has Awakened</h2>
          <p className="text-gray-400 mb-6 max-w-md">
            Une erreur fatale s'est produite.
          </p>
          <button onClick={() => window.location.reload()} className="metal-button">
            🔄 Invoquer à nouveau
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
