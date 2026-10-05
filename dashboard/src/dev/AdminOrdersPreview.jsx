import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminShell from '../components/AdminShell';
import OrdersComponent from '../components/OrdersComponent';
import { OrderDetailsView } from '../components/OrderDetails';
import { loadedResource } from '../components/overviewModel';
import { previewAdmin } from './overviewFixtures';
import {
  orderPreviewRecords,
  orderPreviewResources,
  orderScenarios,
} from './ordersFixtures';

export default function AdminOrdersPreview() {
  const navigate = useNavigate();
  const [, setParams] = useSearchParams();
  const [scenario, setScenario] = useState('sample');
  const [resources, setResources] = useState(() =>
    orderPreviewResources('sample'),
  );
  const [orderId, setOrderId] = useState(null);
  const [detail, setDetail] = useState({ data: null, status: 'loading' });
  const [notice, setNotice] = useState('');
  const timers = useRef(new Set());
  const cancel = () => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
  };
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);
  const simulate = (callback) => {
    const timer = setTimeout(() => {
      callback();
      timers.current.delete(timer);
    }, 650);
    timers.current.add(timer);
  };
  const retry = (key) => {
    setResources((previous) => ({
      ...previous,
      [key]: { ...previous[key], status: 'loading' },
    }));
    simulate(() =>
      setResources((previous) => ({
        ...previous,
        [key]: orderPreviewResources(scenario === 'empty' ? 'empty' : 'sample')[
          key
        ],
      })),
    );
  };
  const retryDetail = () => {
    setDetail((previous) => ({ ...previous, status: 'loading' }));
    simulate(() =>
      setDetail(
        loadedResource(
          orderPreviewRecords.find((order) => order._id === orderId),
        ),
      ),
    );
  };
  const choose = (value) => {
    cancel();
    setScenario(value);
    setResources(orderPreviewResources(value));
    setParams({}, { replace: true });
    setNotice('');
    const order = orderPreviewRecords[0];
    setOrderId(value.startsWith('detail-') ? order._id : null);
    setDetail(
      value === 'detail-failed'
        ? { data: null, status: 'error' }
        : value === 'detail-missing'
          ? { data: null, status: 'missing' }
          : {
              ...loadedResource(
                value === 'detail-incomplete'
                  ? {
                      _id: order._id,
                      items: null,
                      userId: 'missing-client',
                      paymentStatus: 'unexpected',
                      deliveryStatus: 'future-stage',
                    }
                  : order,
              ),
              status: value === 'detail-stale' ? 'error' : 'ready',
            },
    );
  };
  const visit = (destination) => {
    if (destination === '/') navigate('/preview/overview');
    else if (destination === '/users') navigate('/preview/users');
    else if (/^\/orders(?:\?|$)/.test(destination)) {
      cancel();
      setOrderId(null);
      setNotice('');
    } else if (destination.startsWith('/orders/')) {
      cancel();
      const id = decodeURIComponent(
        destination.split('?')[0].slice('/orders/'.length),
      );
      setOrderId(id);
      setDetail({ data: null, status: 'loading' });
      setNotice('');
      simulate(() =>
        setDetail(
          loadedResource(orderPreviewRecords.find((order) => order._id === id)),
        ),
      );
    } else
      setNotice(
        'This local preview covers orders and their delivery items. Account profiles and payments open from the signed-in workspace.',
      );
  };
  const admin =
    scenario === 'restricted'
      ? { ...previewAdmin, role: 'admin', permissions: ['orders.read'] }
      : previewAdmin;
  return (
    <AdminShell
      admin={admin}
      resources={resources}
      path={orderId ? `/orders/${orderId}` : '/orders'}
      onNavigate={visit}
      onRefresh={() => {
        Object.keys(resources)
          .filter((key) => resources[key].status !== 'restricted')
          .forEach(retry);
        if (orderId) retryDetail();
      }}
      onLogout={() => setNotice('Preview mode has no signed-in account.')}
      preview="/preview/orders"
      previewControls={
        <div className="ad-preview-bar">
          <div>
            <strong>Local preview · sample orders</strong>
            <small>No backend connection or payment actions.</small>
          </div>
          <div className="ad-preview-controls">
            <label htmlFor="orders-preview-state">Preview state</label>
            <select
              id="orders-preview-state"
              value={scenario}
              onChange={(event) => choose(event.target.value)}
            >
              {Object.entries(orderScenarios).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button onClick={() => choose('sample')}>Reset preview</button>
          </div>
        </div>
      }
    >
      {notice && (
        <p className="ad-preview-notice" role="status">
          {notice}
        </p>
      )}
      {orderId ? (
        <OrderDetailsView
          resource={detail}
          resources={resources}
          admin={admin}
          onRetry={retryDetail}
          onRetryLookup={retry}
          onNavigate={visit}
          preview="/preview/orders"
        />
      ) : (
        <OrdersComponent
          resources={resources}
          onRetry={retry}
          onNavigate={visit}
          preview="/preview/orders"
        />
      )}
    </AdminShell>
  );
}
