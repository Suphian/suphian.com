import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console so we can capture it from the preview logs
    console.error("App crashed:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-xl w-full border border-border rounded-lg p-6 shadow-lg bg-card">
            <h1 className="heading-md mb-2">Something went wrong</h1>
            <p className="paragraph mb-4">The app encountered an error. Please hard refresh. If it persists, share the error below.</p>
            {this.state.error && (
              <pre className="whitespace-pre-wrap text-sm bg-muted/40 p-3 rounded-md border border-border overflow-auto max-h-64">
                {this.state.error.message}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
