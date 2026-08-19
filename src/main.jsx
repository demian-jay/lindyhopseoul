import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ExitGuard from './ExitGuard';
import { applyManifestForHost } from './adminHost';
import './index.css';

// Before render, so an install started the moment the page appears already picks
// up the right app.
applyManifestForHost();

const REDIRECT_PATH_KEY = 'swingpop-redirect-path';
const redirectedPath = window.sessionStorage.getItem(REDIRECT_PATH_KEY);

if (redirectedPath) {
  window.sessionStorage.removeItem(REDIRECT_PATH_KEY);
  window.history.replaceState(null, '', redirectedPath);
}

// An admin who signed in with Google comes back to /oauth/success, which is the
// members app's route — on the admin host that is still the admin app, but local
// dev serves both from one origin and would land on the public site instead.
// Put the path back before anything renders, so the admin app is what resumes.
// The flag is left in place: AdminApp is what consumes it, and clearing it here
// would drop the sign-in on the floor.
const GOOGLE_RETURN_KEY = 'swingpop-admin-google-return';
const adminReturnPath = window.sessionStorage.getItem(GOOGLE_RETURN_KEY);

if (adminReturnPath && window.location.pathname.startsWith('/oauth/')) {
  window.history.replaceState(null, '', adminReturnPath);
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
