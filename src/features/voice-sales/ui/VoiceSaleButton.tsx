// voice-sales/ui/VoiceSaleButton.tsx

import React from 'react';
import { useVoiceSale } from './useVoiceSale';

interface VoiceSaleButtonProps {
  onSaleComplete?: (result: { id: string; total: number; itemCount: number }) => void;
  onError?: (error: string) => void;
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
      <div className={`flex flex-col items-center gap-2 p-4 ${className ?? ''}`}>
        <button disabled className="cursor-not-allowed rounded-xl border-0 bg-gray-400 px-6 py-3 text-base font-semibold text-white">
          🎤 Sesli satış desteklenmiyor
        </button>
        <p className="m-0 text-center text-xs text-gray-500">Chrome, Edge veya Safari kullanın.</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-2 p-4 ${className ?? ''}`}>
      {/* Main button */}
      {!isListening && !isProcessing && !needsConfirmation && !lastResult?.success && (
        <button onClick={startListening} className="cursor-pointer rounded-xl border-0 bg-blue-600 px-6 py-3 text-base font-semibold text-white transition-all duration-200">
          🎤 Sesli Satış
        </button>
      )}

      {/* Listening state */}
      {isListening && (
        <div className="flex flex-col items-center gap-2">
          <button onClick={stopListening} className="animate-pulse cursor-pointer rounded-xl border-0 bg-red-600 px-6 py-3 text-base font-semibold text-white">
            🔴 Dinleniyor... (Durdur)
          </button>
          {interimTranscript && (
            <p className="m-0 text-sm italic text-gray-500">{interimTranscript}</p>
          )}
          {transcript && (
            <p className="m-0 text-base font-semibold text-gray-900">{transcript}</p>
          )}
        </div>
      )}

      {/* Processing state */}
      {isProcessing && (
        <div className="p-4">
          <p className="text-base font-semibold text-blue-600">⏳ İşleniyor...</p>
        </div>
      )}

      {/* Confirmation needed */}
      {needsConfirmation && confirmationMessage && (
        <div className="flex max-w-md flex-col items-center gap-3 rounded-xl border border-amber-400 bg-amber-50 p-4">
          <pre className="m-0 whitespace-pre-wrap text-center text-sm text-amber-800" style={{ fontFamily: 'inherit' }}>
            {confirmationMessage}
          </pre>
          <div className="flex gap-3">
            <button onClick={confirmSale} className="cursor-pointer rounded-lg border-0 bg-green-600 px-5 py-2.5 text-sm font-semibold text-white">
              ✅ Onayla
            </button>
            <button onClick={cancelSale} className="cursor-pointer rounded-lg border-0 bg-red-600 px-5 py-2.5 text-sm font-semibold text-white">
              ❌ İptal
            </button>
          </div>
        </div>
      )}

      {/* Success result */}
      {lastResult?.success && lastResult.sale && (
        <div className="flex flex-col items-center gap-2">
          <p className="m-0 text-center text-lg font-bold text-green-600">
            ✅ Satış kaydedildi!<br />
            {formatMoney(lastResult.sale.total)}
          </p>
          <button onClick={reset} className="cursor-pointer rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700">
            Yeni Sesli Satış
          </button>
        </div>
      )}

      {/* Error */}
      {error && !needsConfirmation && (
        <div className="flex flex-col items-center gap-2">
          <p className="m-0 text-center text-sm text-red-600">❌ {error}</p>
          <button onClick={reset} className="cursor-pointer rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700">
            Tekrar Dene
          </button>
        </div>
      )}

      {/* Hint */}
      {!isListening && !isProcessing && !needsConfirmation && !lastResult && !error && (
        <p className="m-0 text-center text-xs text-gray-500">
          Örnek: &quot;2 tane 80&apos;lik soba, nakit&quot;
        </p>
      )}
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
  }).format(amount);
}
