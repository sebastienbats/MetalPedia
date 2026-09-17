'use client';

import { Component, ReactNode } from 'react';

interface Props { 
  children: ReactNode; 
  fallback?: ReactNode; 
}

interface State { 
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: any) {
    console.error('🔴 ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="text-7xl mb-4">⚰️</div>
          <h2 className="font-metal text-3xl text-metal-rust mb-2">
            The Beast Has Awakened
          </h2>
          <p className="text-gray-400 mb-4 max-w-md">
            Une erreur inattendue s'est produite. Les Anciens ont été réveillés.
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="text-left bg-red-900/20 border border-red-500/30 rounded p-4 mb-4 max-w-2xl">
              <summary className="cursor-pointer text-red-400 font-bold mb-2">
                🔍 Détails de l'erreur (dev only)
              </summary>
              <pre className="text-xs text-red-300 overflow-auto">
                {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}
          <button 
            onClick={() => window.location.reload()} 
            className="metal-button"
          >
            🔄 Réessayer
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
