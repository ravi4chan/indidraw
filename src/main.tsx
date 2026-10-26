import React, { Suspense, lazy, Component, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
const Editor = lazy(() => import("./editor/Editor"));
class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <main className="error-page">
        <h1>We couldn’t open this view.</h1>
        <p>
          Your saved drawings remain in this browser. Reload to retry. If this
          happens after an update, reconnect once to finish downloading the app.
        </p>
        <a className="button primary" href="/">
          Back to IndiDraw
        </a>
      </main>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      {location.pathname === "/draw" ? (
        <Suspense
          fallback={<main className="loading">Opening your canvas…</main>}
        >
          <Editor />
        </Suspense>
      ) : (
        <App />
      )}
    </ErrorBoundary>
  </React.StrictMode>,
);
if ("serviceWorker" in navigator && import.meta.env.PROD)
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      window.dispatchEvent(new Event("indidraw-cache-error"));
    });
  });
