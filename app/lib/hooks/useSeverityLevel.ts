import { useMemo } from 'react';

export interface SeverityInfo {
  level: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  color: string;
}

/**
 * Custom hook to calculate severity level based on overpricing percentage
 * Returns badge variant and color class for consistent severity indicators
 * 
 * @param percentage - Overpricing percentage value
 * @returns Severity level information (level, variant, color)
 */
export function useSeverityLevel(percentage: number): SeverityInfo {
  return useMemo(() => {
    if (percentage <= 12) {
      return { level: 'Bajo', variant: 'secondary' as const, color: 'text-yellow-600' };
    } else if (percentage <= 18) {
      return { level: 'Medio', variant: 'outline' as const, color: 'text-pink-600' };
    } else {
      return { level: 'Alto', variant: 'destructive' as const, color: 'text-red-600' };
    }
  }, [percentage]);
}
