import './index.css';
// DEV tracer: shows exactly where a POST to /rest/v1/users comes from
if (import.meta.env.DEV) {
  const _fetch = window.fetch;
  window.fetch = (...args: any[]) => {
    const url = String(args[0]);
    const init = (args[1] ?? {}) as RequestInit;
    const method = (init.method ?? 'GET').toUpperCase();
    if (url.includes('/rest/v1/users') && method === 'POST') {
      console.group('POST /rest/v1/users triggered here');
      console.trace(); // <-- click the top frame that points to *your* src/... file
      console.groupEnd();
      // debugger; // uncomment to break exactly on the offending line
    }
    return _fetch(...(args as [any, any]));
  };
}

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration);
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
