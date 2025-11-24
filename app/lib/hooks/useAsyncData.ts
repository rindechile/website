import { useEffect, useState, useCallback } from 'react';

export interface AsyncDataState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Generic hook for async data fetching with loading and error states
 * Handles cleanup to prevent state updates on unmounted components
 * 
 * @param fetchFn - Async function that returns the data
 * @param dependencies - Array of dependencies that trigger re-fetch
 * @returns Object containing data, loading, error, and refetch function
 */
export function useAsyncData<T>(
  fetchFn: () => Promise<T | null>,
  dependencies: any[] = []
): AsyncDataState<T> {
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
      setLoading(true);
      setError(null);

      try {
        const result = await fetchFn();
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Fetch error:', err);
          setError(err instanceof Error ? err.message : 'An error occurred');
        }
      } finally {
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
