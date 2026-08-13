/**
 * Standardized Indian Currency Formatter (INR) for React Native
 * Formats numbers into Indian Numbering System: ₹10,000, ₹1,00,000, ₹10,00,000, ₹1,00,00,000
 */
export function formatINR(amount?: number | string | null): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '₹0';
  }
  const numericAmount = Number(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(numericAmount);
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch (e) {
    return String(dateString);
  }
}

export function formatDateTime(dateString?: string | null): string {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch (e) {
    return String(dateString);
  }
}

export function getInitials(name?: string | null): string {
  if (!name || !name.trim()) return 'AT';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatCurrency(amount?: number | string | null): string {
  return formatINR(amount);
}

export function formatPercent(value?: number | string | null): string {
  if (value === null || value === undefined || isNaN(Number(value))) return '0%';
  return `${Number(value)}%`;
}

export function formatCompactCurrency(amount?: number | string | null): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return '₹0';
  const num = Number(amount);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)} K`;
  return formatINR(num);
}

export function numberToWordsINR(amount: number): string {
  return `${formatINR(amount)} Only`;
}

export function maskContact(contact?: string | null): string {
  if (!contact) return '';
  if (contact.includes('@')) {
    const [user, domain] = contact.split('@');
    return `${user.substring(0, 2)}***@${domain}`;
  }
  const digits = contact.replace(/\D/g, '');
  if (digits.length >= 10) {
    return `${digits.substring(0, 2)}******${digits.substring(digits.length - 2)}`;
  }
  return contact;
}
