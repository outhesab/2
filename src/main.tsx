import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { requestAllPermissions } from "./lib/permissions";
import { ThemeProvider } from "@/theme";

if (import.meta.env.DEV) {
  import("react-scan").then(({ scan }) => scan({ enabled: true }));
}

requestAllPermissions().catch(() => console.warn('[main] Izin istegi basarisiz'));
import { createRecorder } from "@/lib/consoleRecorder";
createRecorder();

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);