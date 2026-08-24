'use client';

import { Component, ReactNode } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; }

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="text-7xl mb-4">⚰️</div>
          <h2 className="font-metal text-3xl text-metal-rust mb-2">The Beast Has Awakened</h2>
          <button onClick={() => window.location.reload()} className="metal-button">
            🔄 Réessayer
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
