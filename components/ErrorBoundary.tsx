
import React, { Component, ErrorInfo, ReactNode } from "react";
import { UI_TEXT } from "../constants";
import { Logo } from "./Logo";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  // Explicitly declare props to avoid TS errors in strict environments
  readonly props: Readonly<Props>;
  public state: State = { hasError: false };

  constructor(props: Props) {
    super(props);
    // this.props = props; // Removed to fix TS error
  }

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
      // Clear corrupt data
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // Simple localized fallback (defaulting to EN if context unavailable, 
      // but UI_TEXT is available globally)
      const t = UI_TEXT['en'].errorBoundary;

      return (
        <div className="min-h-screen bg-[#0f0a1e] flex flex-col items-center justify-center p-6 text-center">
            <div className="mb-6 p-4 bg-white/5 rounded-full animate-pulse">
                <Logo className="w-16 h-16 grayscale opacity-50" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{t.title}</h1>
            <p className="text-slate-400 mb-8 max-w-md">{t.subtitle}</p>
            <button 
                onClick={this.handleReset}
                className="px-6 py-3 bg-red-500/10 border border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all font-semibold"
            >
                {t.resetBtn}
            </button>
        </div>
      );
    }

    return this.props.children || null;
  }
}
