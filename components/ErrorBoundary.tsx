import React, { ErrorInfo, ReactNode } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { clearDatabase } from "../utils/db";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = async () => {
    try {
        await clearDatabase();
        localStorage.clear();
        window.location.reload();
    } catch (e) {
        alert("Failed to clear. Please clear browser history manually.");
        window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center border border-red-100">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-500 mb-6 text-sm">
              The application encountered an unexpected error, likely due to corrupted data cache or a bad update.
            </p>
            
            <div className="bg-red-50 p-3 rounded text-left text-xs font-mono text-red-700 mb-6 overflow-auto max-h-32 border border-red-200">
                {this.state.error?.message || "Unknown Error"}
            </div>

            <button
              onClick={this.handleReset}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors shadow-sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Reset Data & Reload
            </button>
            <p className="mt-4 text-xs text-gray-400">
                Clicking above will wipe local storage and fetch fresh data from the server.
            </p>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}