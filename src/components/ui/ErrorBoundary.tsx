import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return this.props.fallback ?? (
        <div className="alert alert-error m-4">
          <div className="text-center">
            <h2 className="font-semibold mb-2">Coś poszło nie tak</h2>
            <p className="text-sm mb-3">{this.state.error.message}</p>
            <button onClick={() => this.setState({ error: null })} className="btn btn-sm">Spróbuj ponownie</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
