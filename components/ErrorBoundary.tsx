import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
    // Refresh the page to reset the app state
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-stone-900 border-2 border-heritage-gold/30 rounded-lg p-8 text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-heritage-gold/10 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-heritage-gold"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-serif text-heritage-gold">
                Something went wrong
              </h1>
              <p className="text-stone-400 text-sm">
                We encountered an unexpected error. Don't worry, your data is safe.
              </p>
            </div>

            {this.state.error && (
              <details className="text-left">
                <summary className="text-sm text-stone-500 cursor-pointer hover:text-heritage-gold transition-colors">
                  Technical Details
                </summary>
                <pre className="mt-2 p-3 bg-stone-950 rounded text-xs text-stone-400 overflow-auto max-h-32">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}

            <button
              onClick={this.handleReset}
              className="w-full bg-heritage-gold hover:bg-[#b5952f] text-black font-bold py-3 px-6 rounded-lg transition-colors font-serif uppercase tracking-wider"
            >
              Return to Home
            </button>

            <p className="text-xs text-stone-600">
              If the problem persists, try clearing your browser cache.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
