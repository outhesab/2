import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { requestAllPermissions } from "./lib/permissions";
import { ThemeProvider } from "@/theme";

requestAllPermissions().catch(() => console.warn('[main] İzin isteği başarısız'));

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
