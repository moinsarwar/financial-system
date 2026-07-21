import React from 'react';

export class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any, info: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }
  static getDerivedStateFromError(_error: any) {
    return { hasError: true, error: _error };
  }
  componentDidCatch(_error: any, info: any) {
    this.setState({ info });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding: 20, background: 'red', color: 'white'}}>
          <h2>Something went wrong.</h2>
          <pre>{this.state.error?.toString()}</pre>
          <pre>{this.state.info?.componentStack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
