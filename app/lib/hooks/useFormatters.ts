import { useCallback } from 'react';

/**
 * Custom hook for number, currency, and percentage formatting
 * Centralizes formatting logic used across multiple components
 */
export function useFormatters() {
  const formatNumber = useCallback((num: number) => {
    return new Intl.NumberFormat('es-CL').format(num);
  }, []);

  const formatPercentage = useCallback((num: number, decimals = 2) => {
    return `${num.toFixed(decimals)}%`;
  }, []);

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }, []);

  return { formatNumber, formatPercentage, formatCurrency };
}
