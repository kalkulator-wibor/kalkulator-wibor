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
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-4 text-center">
          <h2 className="text-red-800 font-semibold mb-2">Coś poszło nie tak</h2>
          <p className="text-red-600 text-sm mb-3">{this.state.error.message}</p>
          <button onClick={() => this.setState({ error: null })}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm cursor-pointer">
            Spróbuj ponownie
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
