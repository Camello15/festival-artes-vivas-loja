import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../../lib/api';
import { getFestivalSummary, type FestivalSummary } from './api';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: FestivalSummary };

export function useFestivalSummary() {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getFestivalSummary()
      .then((data) => !cancelled && setState({ status: 'success', data }))
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.';
        setState({ status: 'error', message });
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((n) => n + 1);
  }, []);

  return { state, retry };
}
