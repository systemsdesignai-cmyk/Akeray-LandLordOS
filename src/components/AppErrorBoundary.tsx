import React from 'react';
import { resolveAssetUrl } from '../utils/assetUrl';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Minimal, accessible startup and runtime error boundary so unexpected
 * production exceptions display a transparent diagnostic and recovery screen
 * instead of an unexplained blank page.
 */
export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[Akarai] Unhandled application error:', error, info.componentStack);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleReturnHome = (): void => {
    const base = import.meta.env.BASE_URL || '/';
    window.location.assign(base);
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const errorMessage =
      this.state.error?.message || 'An unexpected runtime error prevented Akarai from rendering.';

    return (
      <div
        role="alert"
        aria-live="assertive"
        className="min-h-screen flex items-center justify-center bg-[#EDF1F5] dark:bg-[#000000] text-[#111318] dark:text-[#FFFFFF] px-4 py-8"
      >
        <div className="w-full max-w-[400px] rounded-[24px] bg-[#FFFFFF] dark:bg-[#15181C] border border-[#E6ECF3] dark:border-[#262B31] p-6 text-center space-y-4 shadow-[0_6px_24px_rgba(11,27,59,0.08)] dark:shadow-none">
          <img
            src={resolveAssetUrl('akarai-symbol.png')}
            alt="Akarai"
            className="w-14 h-14 mx-auto object-contain rounded-[14px]"
          />

          <div className="space-y-1.5">
            <h1 className="text-[19px] font-bold tracking-[-0.02em] text-[#0B1B3B] dark:text-[#FFFFFF]">
              Akarai could not finish loading
            </h1>
            <p className="text-[13px] text-[#626A78] dark:text-[#98A1B2] leading-relaxed">
              Your local property, tenant, and payment records have not been deleted. You can reload
              the app or return to the Home screen.
            </p>
          </div>

          <div className="rounded-[14px] bg-[#FFEEF0] dark:bg-[#2C1519] border border-[#FAD6DA] dark:border-[#4B2329] px-3.5 py-2.5 text-left">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[#E5252A] dark:text-[#FF6B70]">
              Error details
            </div>
            <p className="mt-1 text-[12px] font-mono break-words text-[#111318] dark:text-[#F3F4F6]">
              {errorMessage}
            </p>
          </div>

          <div className="flex flex-col gap-2.5 pt-1">
            <button
              type="button"
              onClick={this.handleReload}
              className="w-full min-h-[46px] px-5 py-2.5 rounded-full bg-[#0145F2] hover:bg-[#0039CC] text-[#FFFFFF] text-[14px] font-semibold transition-colors"
            >
              Reload Akarai
            </button>
            <button
              type="button"
              onClick={this.handleReturnHome}
              className="w-full min-h-[46px] px-5 py-2.5 rounded-full border border-[#D4DCE8] dark:border-[#2B313B] bg-transparent text-[14px] font-semibold text-[#111318] dark:text-[#FFFFFF] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }
}
