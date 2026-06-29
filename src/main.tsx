import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './design-tokens.css';
import { requestAllPermissions } from './lib/permissions';
import { ThemeProvider } from '@/theme';
import { createRecorder } from '@/lib/consoleRecorder';
import { logger } from '@/lib/logger';
import { Component } from 'react';
import type { ReactNode } from 'react';

if (import.meta.env.DEV) {
  import('react-scan').then(({ scan }) => scan({ enabled: true }));
}

requestAllPermissions().catch(() => logger.warn('app', 'main: Izin istegi basarisiz'));
createRecorder();

interface ErrorBoundaryProps {
  children: ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
}
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            gap: 16,
            padding: 24,
            textAlign: 'center',
            background: '#0f172a',
            color: '#f1f5f9',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Bir hata oluştu</h1>
          <p style={{ color: '#94a3b8', maxWidth: 400 }}>
            Uygulama beklenmeyen bir hatayla karşılaştı. Lütfen sayfayı yenileyin.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              border: 'none',
              background: '#ff5722',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Sayfayı Yenile
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);
