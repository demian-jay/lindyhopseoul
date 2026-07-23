import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ExitGuard from './ExitGuard';
import './index.css';

const REDIRECT_PATH_KEY = 'swingpop-redirect-path';
const redirectedPath = window.sessionStorage.getItem(REDIRECT_PATH_KEY);

if (redirectedPath) {
  window.sessionStorage.removeItem(REDIRECT_PATH_KEY);
  window.history.replaceState(null, '', redirectedPath);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    {/* Outside App so it covers the admin screens too — both live in this one
        page, and both lose whatever is half-written when back walks out. */}
    <ExitGuard />
  </React.StrictMode>
);

// Production only: a worker controlling the dev server would sit in front of
// HMR and serve confusing results. Verify it with `npm run preview`, which
// serves the real build over localhost and so counts as a secure context.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      // Registration failing costs installability, not the site itself, so log
      // and carry on rather than surfacing anything to the visitor.
      console.error('Service worker registration failed', error);
    });
  });
}
