import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminShell from '../components/AdminShell';
import DashboardLanding from '../components/DashboardLanding';
import AnalyticsComponent from '../components/AnalyticsComponent';
import { loadedResource } from '../components/overviewModel';
import {
  adminForScenario,
  previewRecords,
  resourcesForScenario,
  scenarios,
} from './overviewFixtures';

export default function AdminOverviewPreview() {
  const go = useNavigate();
  const [scenario, setScenario] = useState('sample');
  const [resources, setResources] = useState(() =>
    resourcesForScenario('sample'),
  );
  const [notice, setNotice] = useState('');
  const [path, setPath] = useState('/');
  const timers = useRef(new Set());
  const cancelPending = () => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
  };
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);
  const choose = (value) => {
    cancelPending();
    setScenario(value);
    setResources(resourcesForScenario(value));
    setNotice('');
    setPath('/');
  };
  const retry = (keys) => {
    setResources((previous) =>
      Object.fromEntries(
        Object.entries(previous).map(([key, value]) => [
          key,
          keys.includes(key)
            ? { ...value, status: 'loading', error: '' }
            : value,
        ]),
      ),
    );
    const timer = setTimeout(() => {
      setResources((previous) => ({
        ...previous,
        ...Object.fromEntries(
          keys.map((key) => [
            key,
            loadedResource(scenario === 'empty' ? [] : previewRecords[key]),
          ]),
        ),
      }));
      timers.current.delete(timer);
    }, 650);
    timers.current.add(timer);
  };
  const navigate = (destination) => {
    if (destination === '/' || destination === '/analytics') {
      setPath(destination);
      setNotice('');
    } else if (destination === '/users') go('/preview/users');
    else
      setNotice(
        'This preview covers the overview and navigation. Management pages open from the signed-in admin workspace.',
      );
  };
  return (
    <AdminShell
      admin={adminForScenario(scenario)}
      resources={resources}
      path={path}
      onNavigate={navigate}
      onRefresh={() =>
        retry(
          Object.keys(resources).filter(
            (key) => resources[key].status !== 'restricted',
          ),
        )
      }
      onLogout={() => setNotice('Preview mode has no signed-in account.')}
      preview
      previewControls={
        <div className="ad-preview-bar">
          <div>
            <strong>Local preview · sample data</strong>
            <small>No backend connection or account is required.</small>
          </div>
          <div className="ad-preview-controls">
            <label htmlFor="preview-state">Preview state</label>
            <select
              id="preview-state"
              value={scenario}
              onChange={(event) => choose(event.target.value)}
            >
              {Object.entries(scenarios).map(([value, label]) => (
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
      {path === '/analytics' ? (
        <AnalyticsComponent onNavigate={navigate} preview />
      ) : (
        <DashboardLanding
          admin={adminForScenario(scenario)}
          resources={resources}
          onRetry={(key) => retry([key])}
          onNavigate={navigate}
          preview
        />
      )}
    </AdminShell>
  );
}
