// voice-sales/ui/VoiceSaleButton.tsx

import React from 'react';
import { useVoiceSale } from './useVoiceSale';

interface VoiceSaleButtonProps {
  /** Called when a sale is successfully completed */
  onSaleComplete?: (result: { id: string; total: number; itemCount: number }) => void;
  /** Called when an error occurs */
  onError?: (error: string) => void;
  /** Additional CSS class */
  className?: string;
}

/**
 * Voice Sale Button Component
 *
 * Usage:
 * ```tsx
 * <VoiceSaleButton
 *   onSaleComplete={(r) => console.log('Sale:', r)}
 *   onError={(e) => toast.error(e)}
 * />
 * ```
 */
export function VoiceSaleButton({ onSaleComplete, onError, className }: VoiceSaleButtonProps) {
  const {
    isListening,
    isProcessing,
    isSupported,
    transcript,
    interimTranscript,
    lastResult,
    error,
    needsConfirmation,
    confirmationMessage,
    startListening,
    stopListening,
    confirmSale,
    cancelSale,
    reset,
  } = useVoiceSale();

  // Notify parent on sale complete
  React.useEffect(() => {
    if (lastResult?.success && lastResult.sale && onSaleComplete) {
      onSaleComplete(lastResult.sale);
    }
  }, [lastResult, onSaleComplete]);

  // Notify parent on error
  React.useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  if (!isSupported) {
    return (
      <div className={className} style={styles.container}>
        <button disabled style={styles.buttonDisabled}>
          🎤 Sesli satış desteklenmiyor
        </button>
        <p style={styles.hint}>Chrome, Edge veya Safari kullanın.</p>
      </div>
    );
  }

  return (
    <div className={className} style={styles.container}>
      {/* Main button */}
      {!isListening && !isProcessing && !needsConfirmation && !lastResult?.success && (
        <button onClick={startListening} style={styles.button}>
          🎤 Sesli Satış
        </button>
      )}

      {/* Listening state */}
      {isListening && (
        <div style={styles.listeningContainer}>
          <button onClick={stopListening} style={styles.buttonListening}>
            🔴 Dinleniyor... (Durdur)
          </button>
          {interimTranscript && (
            <p style={styles.interimText}>{interimTranscript}</p>
          )}
          {transcript && (
            <p style={styles.transcriptText}>{transcript}</p>
          )}
        </div>
      )}

      {/* Processing state */}
      {isProcessing && (
        <div style={styles.processingContainer}>
          <p style={styles.processingText}>⏳ İşleniyor...</p>
        </div>
      )}

      {/* Confirmation needed */}
      {needsConfirmation && confirmationMessage && (
        <div style={styles.confirmationContainer}>
          <pre style={styles.confirmationText}>{confirmationMessage}</pre>
          <div style={styles.confirmationButtons}>
            <button onClick={confirmSale} style={styles.buttonConfirm}>
              ✅ Onayla
            </button>
            <button onClick={cancelSale} style={styles.buttonCancel}>
              ❌ İptal
            </button>
          </div>
        </div>
      )}

      {/* Success result */}
      {lastResult?.success && lastResult.sale && (
        <div style={styles.successContainer}>
          <p style={styles.successText}>
            ✅ Satış kaydedildi!<br />
            {formatMoney(lastResult.sale.total)}
          </p>
          <button onClick={reset} style={styles.buttonSecondary}>
            Yeni Sesli Satış
          </button>
        </div>
      )}

      {/* Error */}
      {error && !needsConfirmation && (
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>❌ {error}</p>
          <button onClick={reset} style={styles.buttonSecondary}>
            Tekrar Dene
          </button>
        </div>
      )}

      {/* Hint */}
      {!isListening && !isProcessing && !needsConfirmation && !lastResult && !error && (
        <p style={styles.hint}>
          Örnek: "2 tane 80'lik soba, nakit"
        </p>
      )}
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: 16,
  },
  button: {
    padding: '12px 24px',
    fontSize: 16,
    fontWeight: 600,
    borderRadius: 12,
    border: 'none',
    backgroundColor: '#2563eb',
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  buttonListening: {
    padding: '12px 24px',
    fontSize: 16,
    fontWeight: 600,
    borderRadius: 12,
    border: 'none',
    backgroundColor: '#dc2626',
    color: '#fff',
    cursor: 'pointer',
    animation: 'pulse 1.5s infinite',
  },
  buttonDisabled: {
    padding: '12px 24px',
    fontSize: 16,
    fontWeight: 600,
    borderRadius: 12,
    border: 'none',
    backgroundColor: '#9ca3af',
    color: '#fff',
    cursor: 'not-allowed',
  },
  buttonConfirm: {
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 600,
    borderRadius: 8,
    border: 'none',
    backgroundColor: '#16a34a',
    color: '#fff',
    cursor: 'pointer',
  },
  buttonCancel: {
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 600,
    borderRadius: 8,
    border: 'none',
    backgroundColor: '#dc2626',
    color: '#fff',
    cursor: 'pointer',
  },
  buttonSecondary: {
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 600,
    borderRadius: 8,
    border: '1px solid #d1d5db',
    backgroundColor: '#fff',
    color: '#374151',
    cursor: 'pointer',
  },
  listeningContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  processingContainer: {
    padding: 16,
  },
  processingText: {
    fontSize: 16,
    fontWeight: 600,
    color: '#2563eb',
  },
  confirmationContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    border: '1px solid #fbbf24',
    backgroundColor: '#fffbeb',
    maxWidth: 400,
  },
  confirmationText: {
    fontSize: 14,
    fontFamily: 'inherit',
    whiteSpace: 'pre-wrap',
    textAlign: 'center',
    margin: 0,
    color: '#92400e',
  },
  confirmationButtons: {
    display: 'flex',
    gap: 12,
  },
  successContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  successText: {
    fontSize: 18,
    fontWeight: 700,
    color: '#16a34a',
    textAlign: 'center',
    margin: 0,
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    textAlign: 'center',
    margin: 0,
  },
  hint: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    margin: 0,
  },
  interimText: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    margin: 0,
  },
  transcriptText: {
    fontSize: 16,
    fontWeight: 600,
    color: '#111827',
    margin: 0,
  },
};

// ─── Helpers ────────────────────────────────────────────────────

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
  }).format(amount);
}
