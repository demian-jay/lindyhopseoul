import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
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
  </React.StrictMode>
);
