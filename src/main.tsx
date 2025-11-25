import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Service worker registration is handled in App.tsx
// This ensures a single, consistent registration point

createRoot(document.getElementById("root")!).render(<App />);
  