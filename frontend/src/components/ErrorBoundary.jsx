import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './ui/Button';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle size={32} className="text-red-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
                    <p className="text-sm text-gray-500 mb-6 max-w-md">
                        The application encountered an unexpected error while rendering this page.
                    </p>
                    {this.state.error && (
                        <div className="bg-red-50 text-red-800 text-xs text-left p-4 rounded-lg w-full max-w-2xl overflow-auto mb-6">
                            <p className="font-mono font-semibold mb-1">{this.state.error.toString()}</p>
                            <pre className="font-mono whitespace-pre-wrap">{this.state.errorInfo?.componentStack}</pre>
                        </div>
                    )}
                    <Button variant="primary" onClick={() => window.location.reload()}>
                        <RefreshCw size={16} className="mr-2" /> Reload Application
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
