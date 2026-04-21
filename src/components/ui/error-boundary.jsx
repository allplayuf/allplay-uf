import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent } from './card';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    console.error('Error caught by boundary:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // You can also log to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0F1513] flex items-center justify-center p-4">
          <Card className="max-w-lg w-full bg-[#121715] border border-[#223029] rounded-[20px] shadow-2xl">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#DC2626] to-[#B91C1C] rounded-3xl flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-white" />
              </div>
              
              <h1 className="text-[24px] leading-[32px] font-bold text-[#F4F7F5] mb-3">
                Något gick fel
              </h1>
              
              <p className="text-[14px] leading-[20px] text-[#B6C2BC] mb-6">
                Vi beklagar, men något oväntat inträffade. Prova att ladda om sidan eller gå tillbaka till startsidan.
              </p>

              {import.meta.env.DEV && this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-[12px] text-[#7B8A83] mb-2">
                    Teknisk information (endast synlig i utvecklingsläge)
                  </summary>
                  <div className="bg-[#0F1513] p-4 rounded-xl overflow-auto max-h-48">
                    <pre className="text-[11px] text-[#DC2626] whitespace-pre-wrap break-words">
                      {this.state.error.toString()}
                      {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={this.handleReset}
                  className="bg-[#2BA84A] hover:bg-[#248232] text-white gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Försök igen
                </Button>
                
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="border-[#223029] text-[#F4F7F5] hover:bg-[#18221E] gap-2"
                >
                  <Home className="w-4 h-4" />
                  Gå till startsidan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;