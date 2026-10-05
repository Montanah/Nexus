import { useCallback, useEffect, useRef, useState } from 'react';
import { getUserDetails } from '../api';
import { detailFailure } from '../components/usersModel';

const initial = (userId) => ({
  userId,
  data: null,
  status: 'loading',
  updatedAt: null,
});
export const useUserDetails = (userId) => {
  const [resource, setResource] = useState(() => initial(userId));
  const request = useRef(null);
  const load = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setResource((previous) => ({
      ...(previous.userId === userId ? previous : initial(userId)),
      status: 'loading',
    }));
    try {
      const data = await getUserDetails(userId, { signal: controller.signal });
      if (!controller.signal.aborted)
        setResource({ userId, data, status: 'ready', updatedAt: Date.now() });
    } catch (error) {
      if (!controller.signal.aborted)
        setResource((previous) => ({
          ...detailFailure(previous, error),
          userId,
        }));
    }
  }, [userId]);
  useEffect(() => {
    load();
    return () => request.current?.abort();
  }, [load]);
  return {
    resource: resource.userId === userId ? resource : initial(userId),
    retry: load,
  };
};
