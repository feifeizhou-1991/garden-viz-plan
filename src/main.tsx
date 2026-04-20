import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Globally block browser-level page zoom (ctrl/cmd + wheel and pinch gestures)
window.addEventListener(
  "wheel",
  (e) => {
    if (e.ctrlKey || (e as any).metaKey) e.preventDefault();
  },
  { passive: false }
);
["gesturestart", "gesturechange", "gestureend"].forEach((evt) => {
  window.addEventListener(evt, (e) => e.preventDefault(), { passive: false } as any);
});
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && ["=", "-", "+", "0"].includes(e.key)) {
    e.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
