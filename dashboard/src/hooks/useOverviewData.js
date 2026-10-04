import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchUsers, fetchProducts, fetchOrders, fetchTravelers } from '../api';
import {
  canRead,
  resourceKeys,
  initialResources,
  loadedResource,
  failedResource,
} from '../components/overviewModel';

const loaders = {
  users: fetchUsers,
  products: fetchProducts,
  orders: fetchOrders,
  travelers: fetchTravelers,
};
export const useOverviewData = (admin) => {
  const access = resourceKeys.filter((key) => canRead(admin, key)).join(',');
  const account = admin?._id || admin?.id || admin?.email || '';
  const allowed = useMemo(() => (access ? access.split(',') : []), [access]);
  const [resources, setResources] = useState(() => initialResources(admin));
  const controllers = useRef({});
  const load = useCallback(
    async (keys = allowed) => {
      await Promise.allSettled(
        keys
          .filter((key) => allowed.includes(key))
          .map(async (key) => {
            controllers.current[key]?.abort();
            const controller = new AbortController();
            controllers.current[key] = controller;
            setResources((previous) => ({
              ...previous,
              [key]: { ...previous[key], status: 'loading', error: '' },
            }));
            try {
              const records = await loaders[key]({ signal: controller.signal });
              if (!controller.signal.aborted)
                setResources((previous) => ({
                  ...previous,
                  [key]: loadedResource(records),
                }));
            } catch (error) {
              if (!controller.signal.aborted)
                setResources((previous) => ({
                  ...previous,
                  [key]: failedResource(previous[key], error),
                }));
            }
          }),
      );
    },
    [allowed],
  );
  useEffect(() => {
    setResources(
      initialResources({ permissions: allowed.map((key) => `${key}.read`) }),
    );
    load();
    const pending = controllers.current;
    return () =>
      Object.values(pending).forEach((controller) => controller.abort());
  }, [account, allowed, load]);
  const setRecords = (key, update) =>
    setResources((previous) => ({
      ...previous,
      [key]: {
        ...previous[key],
        data:
          typeof update === 'function'
            ? update(previous[key].data || [])
            : update,
      },
    }));
  return {
    resources,
    refresh: () => load(),
    retry: (key) => load([key]),
    setRecords,
  };
};
