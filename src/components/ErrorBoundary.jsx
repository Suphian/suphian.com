import React from 'react';
import { errors } from '../content.js';
import { captureException } from '../lib/analytics.js';
import { boundaryReport } from '../lib/errors.js';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Uncaught error:', error, info);
    // Caught here, so in production no window error event reaches errors.js.
    // A no-op where analytics is off.
    captureException(...boundaryReport(error, info));
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="error-state" role="alert">
        <h1 className="page-title">
          {errors.boundary.title}
          <span className="heading-period">.</span>
        </h1>
        <details className="error-details">
          <summary>{errors.boundary.details}</summary>
          <pre>{`${String(error)}\n\n${error.stack ?? ''}`}</pre>
        </details>
        <button type="button" className="button" onClick={() => window.location.reload()}>
          {errors.boundary.reload}
        </button>
      </div>
    );
  }
}
