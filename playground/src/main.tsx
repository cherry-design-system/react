import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../../src/styles/tokens.css";
import "../../src/styles/base.css";
// Every component stylesheet, picked up as components are added.
import.meta.glob("../../src/styles/components/*.css", { eager: true });
import "./styles.css";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
