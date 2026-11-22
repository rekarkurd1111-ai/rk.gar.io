import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message || 'Unknown error' };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Application Error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh w-screen items-center justify-center bg-slate-950 p-6 text-white">
          <div className="w-full max-w-md rounded-2xl border border-rose-500/40 bg-slate-900 p-6 text-center shadow-2xl">
            <h2 className="font-display text-xl font-bold text-rose-400">
              کێشەیەک لە سیستەمدا ڕوویدا
            </h2>
            <p className="mt-2 break-words text-xs text-slate-300">{this.state.errorMessage}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 min-h-[44px] rounded-xl bg-sky-600 px-5 py-2 text-sm font-bold text-white hover:bg-sky-700"
            >
              نوێکردنەوەی پەڕە
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
