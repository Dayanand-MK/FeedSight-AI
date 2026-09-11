import React from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.jsx";
import "./style.css";
import "./farmer.css";
registerSW({
  immediate: true,
  onRegisterError: () => {
    console.warn(
      "Offline installation unavailable; retry on a secure connection.",
    );
  },
});
class Boundary extends React.Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <main>
        <h1>FeedSight AI</h1>
        <p>
          The app could not display this page. Reload to try again. Locally
          saved records are retained.
        </p>
        <button onClick={() => location.reload()}>Reload</button>
      </main>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")).render(
  <Boundary>
    <App />
  </Boundary>,
);
