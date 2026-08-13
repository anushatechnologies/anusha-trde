import { useEffect, useRef, useState } from 'react';
import { receiptService } from '../services/receipt.service';
import { ReceiptDetails, WhatsAppReceiptStatus } from '../types';

interface UseReceiptPollingOptions {
  investmentId?: string;
  initialReceipt?: ReceiptDetails;
  enabled?: boolean;
  maxRetries?: number;
}

const isTerminalStatus = (status?: WhatsAppReceiptStatus): boolean => {
  return (
    status === 'SENT' ||
    status === 'DELIVERED' ||
    status === 'READ' ||
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
    whatsappStatus: initialReceipt?.whatsappStatus || 'QUEUED',
    available: initialReceipt?.available ?? true,
  }));

  const [isPolling, setIsPolling] = useState(false);
  const retryCount = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusRef = useRef<WhatsAppReceiptStatus | undefined>(receipt.whatsappStatus);

  useEffect(() => {
    statusRef.current = receipt.whatsappStatus;
  }, [receipt.whatsappStatus]);

  useEffect(() => {
    if (initialReceipt) {
      setReceipt((prev) => ({
        ...prev,
        ...initialReceipt,
      }));
    }
  }, [initialReceipt]);

  useEffect(() => {
    retryCount.current = 0;
  }, [investmentId]);

  useEffect(() => {
    if (!enabled || !investmentId) {
      setIsPolling(false);
      return;
    }

    if (isTerminalStatus(statusRef.current) || retryCount.current >= maxRetries) {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);

    const poll = async () => {
      if (isTerminalStatus(statusRef.current)) {
        setIsPolling(false);
        return;
      }

      try {
        const res = await receiptService.getReceiptStatus(investmentId);
        if (res.receipt) {
          setReceipt(res.receipt);
          statusRef.current = res.receipt.whatsappStatus;

          if (isTerminalStatus(res.receipt.whatsappStatus)) {
            setIsPolling(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Error polling receipt status:', err);
      }

      retryCount.current += 1;

      if (retryCount.current < maxRetries && !isTerminalStatus(statusRef.current)) {
        timerRef.current = setTimeout(poll, 2500);
      } else {
        setIsPolling(false);
      }
    };

    timerRef.current = setTimeout(poll, 2500);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [investmentId, enabled, maxRetries]);

  return {
    receipt,
    isPolling,
    setReceipt,
  };
};
