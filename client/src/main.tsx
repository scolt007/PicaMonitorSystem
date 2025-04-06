import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./hide-error-overlay.css"; // Import CSS to hide error overlay
import initErrorOverlayRemover from "./errorOverlayRemover";

// Initialize the error overlay remover
document.addEventListener('DOMContentLoaded', () => {
  initErrorOverlayRemover();
});

createRoot(document.getElementById("root")!).render(<App />);
