import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchOrderById } from '../api';
import { detailFailure } from '../components/usersModel';

const initial = (orderId) => ({
  orderId,
  data: null,
  status: 'loading',
  updatedAt: null,
});
export const useOrderDetails = (orderId) => {
  const [resource, setResource] = useState(() => initial(orderId));
  const request = useRef(null);
  const load = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setResource((previous) => ({
      ...(previous.orderId === orderId ? previous : initial(orderId)),
      status: 'loading',
    }));
    try {
      const data = await fetchOrderById(orderId, { signal: controller.signal });
      if (!controller.signal.aborted)
        setResource({ orderId, data, status: 'ready', updatedAt: Date.now() });
    } catch (error) {
      if (!controller.signal.aborted)
        setResource((previous) => ({
          ...detailFailure(previous, error),
          orderId,
        }));
    }
  }, [orderId]);
  useEffect(() => {
    load();
    return () => request.current?.abort();
  }, [load]);
  return {
    resource: resource.orderId === orderId ? resource : initial(orderId),
    retry: load,
  };
};
