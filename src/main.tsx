import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { requestAllPermissions } from "./lib/permissions";
import { ThemeProvider } from "@/theme";
import { createRecorder } from "@/lib/consoleRecorder";

if (import.meta.env.DEV) {
  import("react-scan").then(({ scan }) => scan({ enabled: true }));
}

requestAllPermissions().catch(() => console.warn('[main] Izin istegi basarisiz'));
createRecorder();

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);