import { lazy, Suspense } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { useAuth } from './AuthContext';
import AdminShell from './components/AdminShell';
import LoginPage from './pages/LoginPage';
import MainRouter from './MainRouter';
import ProtectedRoute from './components/ProtectedRoute';
import { useOverviewData } from './hooks/useOverviewData';

const AdminOverviewPreview = import.meta.env.DEV
  ? lazy(() => import('./dev/AdminOverviewPreview'))
  : null;

const AdminUsersPreview = import.meta.env.DEV
  ? lazy(() => import('./dev/AdminUsersPreview'))
  : null;

const AppContent = () => {
  const { admin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { resources, refresh, retry, setRecords } = useOverviewData(admin);
  return (
    <AdminShell
      admin={admin}
      resources={resources}
      path={location.pathname}
      onNavigate={navigate}
      onRefresh={refresh}
      onLogout={logout}
    >
      {(isDarkTheme) => (
        <MainRouter
          admin={admin}
          resources={resources}
          onRetry={retry}
          onNavigate={navigate}
          setRecords={setRecords}
          isDarkTheme={isDarkTheme}
        />
      )}
    </AdminShell>
  );
};

export default function App() {
  const { isAuthenticated } = useAuth();
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {import.meta.env.DEV && (
          <Route
            path="/preview/overview"
            element={
              <Suspense fallback={<p>Loading overview preview…</p>}>
                <AdminOverviewPreview />
              </Suspense>
            }
          />
        )}
        {import.meta.env.DEV && (
          <Route
            path="/preview/users"
            element={
              <Suspense fallback={<p>Loading users preview…</p>}>
                <AdminUsersPreview />
              </Suspense>
            }
          />
        )}
        <Route
          path="/*"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <AppContent />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
