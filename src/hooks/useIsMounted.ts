import { useEffect, useRef } from 'react';

/**
 * Hook to track whether the component is currently mounted.
 * Useful for preventing state updates on unmounted components in async callbacks.
 */
export function useIsMounted() {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return isMounted;
}
