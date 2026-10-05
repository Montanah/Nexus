import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminShell from '../components/AdminShell';
import UsersComponent from '../components/UsersComponent';
import { UserProfileView } from '../components/UserDetails';
import { ResourceEmpty } from '../components/ResourceState';
import { loadedResource } from '../components/overviewModel';
import { previewAdmin, resourcesForScenario } from './overviewFixtures';
import {
  previewUserDetails,
  userScenarios,
  usersPreviewRecords,
  usersResource,
} from './usersFixtures';

export default function AdminUsersPreview() {
  const navigate = useNavigate();
  const [, setParams] = useSearchParams();
  const [scenario, setScenario] = useState('sample');
  const [resource, setResource] = useState(() => usersResource('sample'));
  const [userId, setUserId] = useState(null);
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
  const retryUsers = () => {
    setResource((previous) => ({ ...previous, status: 'loading' }));
    simulate(() =>
      setResource(
        loadedResource(scenario === 'empty' ? [] : usersPreviewRecords),
      ),
    );
  };
  const retryProfile = () => {
    setDetail((previous) => ({ ...previous, status: 'loading' }));
    simulate(() => setDetail(loadedResource(previewUserDetails(userId))));
  };
  const choose = (value) => {
    cancel();
    setScenario(value);
    setResource(usersResource(value));
    setNotice('');
    setParams({}, { replace: true });
    const id = usersPreviewRecords[0]._id;
    setUserId(value.startsWith('profile-') ? id : null);
    const data = previewUserDetails(id);
    setDetail(
      value === 'profile-failed'
        ? { data: null, status: 'error' }
        : value === 'profile-missing'
          ? { data: null, status: 'missing' }
          : value === 'profile-restricted'
            ? { data: null, status: 'restricted' }
            : loadedResource(
                value === 'profile-incomplete'
                  ? { ...data, orders: null, payments: null }
                  : data,
              ),
    );
  };
  const visit = (destination) => {
    if (destination === '/') navigate('/preview/overview');
    else if (destination === '/orders') navigate('/preview/orders');
    else if (/^\/users(?:\?|$)/.test(destination)) {
      cancel();
      setUserId(null);
      setNotice('');
    } else if (destination.startsWith('/users/')) {
      cancel();
      const id = decodeURIComponent(
        destination.split('?')[0].slice('/users/'.length),
      );
      setUserId(id);
      setDetail({ data: null, status: 'loading' });
      setNotice('');
      simulate(() => setDetail(loadedResource(previewUserDetails(id))));
    } else
      setNotice(
        'This local preview covers the user directory and profiles. Other pages open from the signed-in workspace.',
      );
  };
  const admin =
    scenario === 'restricted'
      ? { ...previewAdmin, role: 'admin', permissions: ['orders.read'] }
      : previewAdmin;
  return (
    <AdminShell
      admin={admin}
      resources={{ ...resourcesForScenario('sample'), users: resource }}
      path={userId ? `/users/${userId}` : '/users'}
      onNavigate={visit}
      onRefresh={() => {
        retryUsers();
        if (userId) retryProfile();
      }}
      onLogout={() => setNotice('Preview mode has no signed-in account.')}
      preview="/preview/users"
      previewControls={
        <div className="ad-preview-bar">
          <div>
            <strong>Local preview · sample accounts</strong>
            <small>No backend connection. Changes stay in this preview.</small>
          </div>
          <div className="ad-preview-controls">
            <label htmlFor="users-preview-state">Preview state</label>
            <select
              id="users-preview-state"
              value={scenario}
              onChange={(event) => choose(event.target.value)}
            >
              {Object.entries(userScenarios).map(([value, label]) => (
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
      {scenario === 'restricted' ? (
        <ResourceEmpty resource={resource} label="Users" />
      ) : userId ? (
        <UserProfileView
          key={userId}
          resource={detail}
          onRetry={retryProfile}
          onNavigate={visit}
          preview="/preview/users"
        />
      ) : (
        <UsersComponent
          resource={resource}
          onRetry={retryUsers}
          onNavigate={visit}
          preview="/preview/users"
        />
      )}
    </AdminShell>
  );
}
