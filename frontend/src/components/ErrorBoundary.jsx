import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Log to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
      console.log('Production error:', { error, errorInfo });
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorCount={this.state.errorCount}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

function ErrorFallback({ error, errorInfo, errorCount, onReset }) {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-6 md:p-10">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 p-4 rounded-full">
            <AlertTriangle className="w-12 h-12 md:w-16 md:h-16 text-red-600" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-4">
          Oops! Something went wrong
        </h1>

        {/* Description */}
        <p className="text-gray-600 text-center mb-8 text-sm md:text-base">
          We're sorry for the inconvenience. The application encountered an unexpected error.
          {errorCount > 1 && (
            <span className="block mt-2 text-red-600 font-medium">
              This error has occurred {errorCount} times. Please contact support if it persists.
            </span>
          )}
        </p>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === 'development' && error && (
          <div className="mb-8 bg-gray-50 rounded-lg p-4 border border-gray-200 overflow-hidden">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Error Details:</h3>
            <pre className="text-xs text-red-600 overflow-x-auto whitespace-pre-wrap break-words">
              {error.toString()}
            </pre>
            {errorInfo && (
              <details className="mt-4">
                <summary className="text-xs font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                  Stack Trace
                </summary>
                <pre className="text-xs text-gray-600 mt-2 overflow-x-auto whitespace-pre-wrap break-words">
                  {errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onReset}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Try Again</span>
          </button>
          
          <button
            onClick={handleGoHome}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            <Home className="w-5 h-5" />
            <span>Go Home</span>
          </button>
        </div>

        {/* Support Info */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact support at{' '}
            <a href="mailto:support@carequeue.com" className="text-indigo-600 hover:underline">
              support@carequeue.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ErrorBoundary;
