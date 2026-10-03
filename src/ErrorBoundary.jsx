import React from 'react';
import { reportError } from './diagnostics';

export default class ErrorBoundary extends React.Component {
  state = { failed: false, eventId: '' };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { this.setState({ eventId: reportError('react', error) }); }
  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="mx-auto mt-20 max-w-lg break-words p-6">
      <h1>화면 오류 / Something went wrong</h1>
      <p>오류 번호 / Error ID: {this.state.eventId}</p>
      <button type="button" onClick={() => window.location.reload()}>다시 열기 / Reload</button>
      {' · '}<a href="/">메인으로 / Home</a>
    </main>;
  }
}
