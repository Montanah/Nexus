import { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  RefreshCw,
  Settings,
  Sun,
  User,
  ShieldCheck,
} from 'lucide-react';
import Sidebar from './Sidebar';
import AdminLink from './AdminLink';
import { initials, pageTitles, sectionForPath } from './overviewModel';
import './admin.css';

const readTheme = () => {
  try {
    return localStorage.getItem('nexus-admin-theme') === 'dark';
  } catch {
    return false;
  }
};
const AdminShell = ({
  admin,
  resources,
  path,
  onNavigate,
  onRefresh,
  onLogout,
  children,
  preview = false,
  previewControls,
}) => {
  const [dark, setDark] = useState(readTheme);
  const [mobile, setMobile] = useState(
    () => window.matchMedia('(max-width: 980px)').matches,
  );
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const menuButton = useRef(null),
    sidebar = useRef(null),
    account = useRef(null),
    accountButton = useRef(null),
    main = useRef(null);
  const restoreMenuFocus = useRef(false);
  const section = sectionForPath(path),
    title = pageTitles[section] || 'Workspace';
  const refreshing = Object.values(resources).some(
    (resource) => resource.status === 'loading',
  );
  const hasDataAccess = Object.values(resources).some(
    (resource) => resource.status !== 'restricted',
  );
  const close = () => {
    restoreMenuFocus.current = true;
    setOpen(false);
  };
  const navigate = (destination) => {
    setOpen(false);
    setAccountOpen(false);
    onNavigate(destination);
  };
  const toggleTheme = () =>
    setDark((previous) => {
      const next = !previous;
      try {
        localStorage.setItem('nexus-admin-theme', next ? 'dark' : 'light');
      } catch {
        /* The current tab can still change themes. */
      }
      return next;
    });
  useEffect(() => {
    const query = window.matchMedia('(max-width: 980px)');
    const change = (event) => {
      setMobile(event.matches);
      setOpen(false);
    };
    query.addEventListener('change', change);
    return () => query.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} | Nexus Admin`;
    return () => {
      document.title = previous;
    };
  }, [title]);
  useEffect(() => {
    if (!mobile || !open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    sidebar.current?.querySelector('button')?.focus();
    const keydown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        restoreMenuFocus.current = true;
        setOpen(false);
      }
      if (event.key !== 'Tab') return;
      const targets = [
        ...sidebar.current.querySelectorAll('a[href], button:not(:disabled)'),
      ].filter((element) => element.getClientRects().length);
      const first = targets[0],
        last = targets.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', keydown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', keydown);
    };
  }, [mobile, open]);
  useEffect(() => {
    if (!accountOpen) return;
    const outside = (event) => {
      if (!account.current?.contains(event.target)) setAccountOpen(false);
    };
    const escape = (event) => {
      if (event.key === 'Escape') {
        setAccountOpen(false);
        accountButton.current?.focus();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [accountOpen]);
  useEffect(() => {
    if (!open && restoreMenuFocus.current) {
      menuButton.current?.focus();
      restoreMenuFocus.current = false;
    }
  }, [open]);
  useEffect(() => {
    main.current?.focus({ preventScroll: true });
  }, [path]);
  return (
    <div className={`nexus-admin ${dark ? 'ad-dark' : ''}`}>
      <a className="ad-skip" href="#admin-main">
        Skip to content
      </a>
      {mobile && open && (
        <button
          className="ad-backdrop"
          onClick={close}
          tabIndex={-1}
          aria-label="Close navigation overlay"
        />
      )}
      <Sidebar
        admin={admin}
        resources={resources}
        activeSection={section}
        open={open}
        mobile={mobile}
        sidebarRef={sidebar}
        onClose={close}
        onNavigate={navigate}
        preview={preview}
      />
      <div className="ad-workspace" inert={mobile && open ? true : undefined}>
        {previewControls}
        <header className="ad-topbar">
          <div className="ad-topbar-start">
            <button
              ref={menuButton}
              className="ad-icon-button ad-menu-toggle"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
              aria-expanded={open}
              aria-controls="admin-navigation"
            >
              <Menu aria-hidden="true" />
            </button>
            <span className="ad-breadcrumb">
              Workspace <span>/</span> <strong>{title}</strong>
            </span>
          </div>
          <div className="ad-topbar-actions">
            <button
              className="ad-icon-button"
              onClick={onRefresh}
              disabled={refreshing || !hasDataAccess}
              aria-label="Refresh overview data"
              title="Refresh overview data"
            >
              <RefreshCw
                aria-hidden="true"
                className={refreshing ? 'ad-spinning' : ''}
              />
            </button>
            <button
              className="ad-icon-button"
              onClick={toggleTheme}
              aria-label={
                dark ? 'Switch to light theme' : 'Switch to dark theme'
              }
            >
              {dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
            </button>
            <span className="ad-topbar-divider" />
            <div className="ad-account-menu" ref={account}>
              <button
                className="ad-account-toggle"
                ref={accountButton}
                onClick={() => setAccountOpen((value) => !value)}
                aria-expanded={accountOpen}
                aria-controls="admin-account-menu"
                aria-label="Account options"
              >
                <span className="ad-avatar">{initials(admin?.name)}</span>
                <span className="ad-account-name">
                  {admin?.name || 'Your account'}
                  <small>
                    {admin?.role === 'superadmin'
                      ? 'Super administrator'
                      : 'Administrator'}
                  </small>
                </span>
                <ChevronDown aria-hidden="true" />
              </button>
              {accountOpen && (
                <div className="ad-account-dropdown" id="admin-account-menu">
                  <strong>{admin?.name || 'Your account'}</strong>
                  {admin?.email && <p>{admin.email}</p>}
                  <AdminLink
                    to="/profile"
                    onNavigate={navigate}
                    preview={preview}
                  >
                    <User aria-hidden="true" />
                    View profile
                  </AdminLink>
                  <AdminLink
                    to="/edit-profile"
                    onNavigate={navigate}
                    preview={preview}
                  >
                    <Settings aria-hidden="true" />
                    Edit profile
                  </AdminLink>
                  <button
                    onClick={() => {
                      setAccountOpen(false);
                      onLogout();
                    }}
                  >
                    <LogOut aria-hidden="true" />
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="ad-main" id="admin-main" ref={main} tabIndex={-1}>
          {section !== 'overview' && (
            <div className="ad-page-title">
              <span className="ad-eyebrow">YOUR WORKSPACE</span>
              <h1>{title}</h1>
            </div>
          )}
          {typeof children === 'function' ? children(dark) : children}
        </main>
        <footer className="ad-footer">
          <span>© {new Date().getFullYear()} Nexus</span>
          <span>
            <ShieldCheck aria-hidden="true" />
            Admin workspace
          </span>
          <span>Good things travel together.</span>
        </footer>
      </div>
    </div>
  );
};
export default AdminShell;
