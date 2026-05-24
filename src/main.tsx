import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { requestAllPermissions } from "./lib/permissions";

// Uygulama başlangıcında izinleri iste (kullanıcıyı rahatsız etmemek için sessizce)
requestAllPermissions().catch(() => console.warn('[main] İzin isteği başarısız'));

createRoot(document.getElementById("root")!).render(<App />);
