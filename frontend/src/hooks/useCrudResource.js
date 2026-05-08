import { useCallback, useEffect, useState } from 'react';

export function useCrudResource(service) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await service.list();
      setItems(Array.isArray(result) ? result : []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const runAction = useCallback(
    async (action, successMessage) => {
      setSubmitting(true);
      setError('');
      setSuccess('');

      try {
        await action();
        setSuccess(successMessage);
        await loadItems();
        return true;
      } catch (actionError) {
        setError(actionError.message);
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [loadItems],
  );

  return {
    items,
    loading,
    submitting,
    error,
    success,
    setError,
    setSuccess,
    loadItems,
    runAction,
  };
}
