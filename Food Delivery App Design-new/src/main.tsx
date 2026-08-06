
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import { assertRuntimeIntegrity } from "./app/lib/security";

assertRuntimeIntegrity();

createRoot(document.getElementById("root")!).render(<App />);
  