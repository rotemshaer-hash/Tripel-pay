import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("Unhandled error in app tree:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            padding: 32,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 40 }}>😕</div>
          <div style={{ fontSize: 17, fontWeight: 800 }}>משהו השתבש</div>
          <div style={{ fontSize: 13.5, color: "var(--ink-soft)" }}>
            קרתה שגיאה בלתי צפויה. אפשר לנסות לרענן את הדף.
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "12px 28px",
              borderRadius: 999,
              border: "none",
              background: "var(--teal-700)",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 800,
            }}
          >
            רענון
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
