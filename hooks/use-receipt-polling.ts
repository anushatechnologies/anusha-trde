import { useEffect, useRef, useState } from 'react';
import { receiptService } from '../services/receipt.service';
import { ReceiptDetails, EmailReceiptStatus } from '../types';

interface UseReceiptPollingOptions {
  investmentId?: string;
  initialReceipt?: ReceiptDetails;
  enabled?: boolean;
  maxRetries?: number;
}

const isTerminalStatus = (status?: EmailReceiptStatus): boolean => {
  return (
    status === 'SENT' ||
    status === 'DELIVERED' ||
    status === 'FAILED'
  );
};

export const useReceiptPolling = ({
  investmentId,
  initialReceipt,
  enabled = true,
  maxRetries = 15,
}: UseReceiptPollingOptions) => {
  const [receipt, setReceipt] = useState<ReceiptDetails>(() => ({
    receiptNumber: initialReceipt?.receiptNumber || 'ATR-2026-000001',
    receiptUrl: initialReceipt?.receiptUrl || '',
    emailStatus: initialReceipt?.emailStatus || 'SENT',
    available: initialReceipt?.available ?? true,
  }));

  const [isPolling, setIsPolling] = useState(false);
  const retryCount = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusRef = useRef<EmailReceiptStatus | undefined>(receipt.emailStatus);

  useEffect(() => {
    statusRef.current = receipt.emailStatus;
  }, [receipt.emailStatus]);

  useEffect(() => {
    if (initialReceipt) {
      setReceipt((prev) => ({
        ...prev,
        ...initialReceipt,
      }));
    }
  }, [initialReceipt]);

  useEffect(() => {
    if (!enabled || !investmentId) return;
    if (isTerminalStatus(statusRef.current)) return;

    let mounted = true;
    setIsPolling(true);

    const poll = async () => {
      if (!mounted) return;

      try {
        const response = await receiptService.getReceiptStatus(investmentId);
        const updated = response.receipt;
        if (mounted && updated) {
          setReceipt(updated);

          if (isTerminalStatus(updated.emailStatus)) {
            setIsPolling(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Receipt poll attempt failed:', err);
      }

      retryCount.current += 1;
      if (retryCount.current >= maxRetries) {
        if (mounted) setIsPolling(false);
        return;
      }

      // Exponential backoff with jitter: 2s, 3s, 4s, 5s...
      const delay = Math.min(2000 + retryCount.current * 1000, 8000);
      if (mounted) {
        timerRef.current = setTimeout(poll, delay);
      }
    };

    // Initial trigger after 2 seconds
    timerRef.current = setTimeout(poll, 2000);

    return () => {
      mounted = false;
      setIsPolling(false);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [investmentId, enabled, maxRetries]);

  return {
    receipt,
    isPolling,
    isDelivered: receipt.emailStatus === 'DELIVERED',
    isFailed: receipt.emailStatus === 'FAILED',
  };
};
