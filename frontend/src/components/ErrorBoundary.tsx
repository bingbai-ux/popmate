'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-text-dark mb-2">
              エラーが発生しました
            </h2>
            <p className="text-text-muted mb-6">
              予期しないエラーが発生しました。<br />
              ページを再読み込みするか、しばらく経ってからお試しください。
            </p>
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full py-3 px-4 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark transition-colors"
              >
                再試行
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 px-4 bg-gray-100 text-text-dark font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                ページを再読み込み
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-sm text-text-muted cursor-pointer">
                  エラー詳細（開発用）
                </summary>
                <pre className="mt-2 p-4 bg-gray-100 rounded-lg text-xs overflow-auto">
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
