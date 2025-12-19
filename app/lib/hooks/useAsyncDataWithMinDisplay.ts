import { useEffect, useState, useCallback } from 'react';

export interface AsyncDataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UseAsyncDataOptions {
  /**
   * Minimum time to display loading state (in milliseconds)
   * Prevents flashing content for fast data sources
   * @default 300
   */
  minDisplayTime?: number;
  
  /**
   * Whether to skip minimum display time for this fetch
   * Useful for static/cached data that loads instantly
   * @default false
   */
  skipMinDisplay?: boolean;
}

/**
 * Generic hook for async data fetching with loading and error states
 * Includes configurable minimum display time to prevent skeleton flashing
 * Handles cleanup to prevent state updates on unmounted components
 * 
 * @param fetchFn - Async function that returns the data
 * @param dependencies - Array of dependencies that trigger re-fetch
 * @param options - Configuration options including minDisplayTime
 * @returns Object containing data, loading, error, and refetch function
 */
export function useAsyncDataWithMinDisplay<T>(
  fetchFn: () => Promise<T | null>,
  dependencies: any[] = [],
  options: UseAsyncDataOptions = {}
): AsyncDataState<T> {
  const { minDisplayTime = 300, skipMinDisplay = false } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = useCallback(() => {
    setRefetchTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetch = async () => {
      const startTime = Date.now();
      setLoading(true);
      setError(null);

      try {
        // Fetch data and wait for minimum display time in parallel
        const fetchPromise = fetchFn();
        const minTimePromise = skipMinDisplay 
          ? Promise.resolve() 
          : new Promise(resolve => setTimeout(resolve, minDisplayTime));

        const [result] = await Promise.all([fetchPromise, minTimePromise]);

        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Fetch error:', err);
          setError(err instanceof Error ? err.message : 'An error occurred');
        }
      } finally {
        // Ensure minimum display time has passed
        if (!cancelled && !skipMinDisplay) {
          const elapsed = Date.now() - startTime;
          if (elapsed < minDisplayTime) {
            await new Promise(resolve => 
              setTimeout(resolve, minDisplayTime - elapsed)
            );
          }
        }
        
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetch();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, refetchTrigger]);

  return { data, loading, error, refetch };
}
