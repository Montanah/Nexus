import {
  BarChart3,
  CreditCard,
  LayoutDashboard,
  Package,
  Route,
  ShieldCheck,
  ShoppingBag,
  Users,
  Wallet,
  X,
  ArrowUpRight,
} from 'lucide-react';
import Logo from '../assets/NexusLogo.png';
import AdminLink from './AdminLink';
import {
  canVisit,
  countLabel,
  initials,
  resourceCaption,
} from './overviewModel';

const groups = [
  {
    label: 'Workspace',
    links: [
      { key: 'overview', path: '/', label: 'Overview', icon: LayoutDashboard },
      { key: 'orders', path: '/orders', label: 'Orders', icon: ShoppingBag },
      { key: 'products', path: '/products', label: 'Products', icon: Package },
      { key: 'users', path: '/users', label: 'Users', icon: Users },
      { key: 'travelers', path: '/travelers', label: 'Travelers', icon: Route },
    ],
  },
  {
    label: 'Platform',
    links: [
      {
        key: 'transactions',
        path: '/transactions',
        label: 'Transactions',
        icon: Wallet,
      },
      {
        key: 'payments',
        path: '/payments',
        label: 'Payments',
        icon: CreditCard,
      },
      {
        key: 'analytics',
        path: '/analytics',
        label: 'Analytics',
        icon: BarChart3,
      },
      {
        key: 'admins',
        path: '/admins',
        label: 'Admin management',
        icon: ShieldCheck,
      },
    ],
  },
];
const Sidebar = ({
  admin,
  resources,
  activeSection,
  open,
  mobile,
  sidebarRef,
  onClose,
  onNavigate,
  preview,
}) => (
  <aside
    className={`ad-sidebar ${open ? 'is-open' : ''}`}
    id="admin-navigation"
    ref={sidebarRef}
    role={mobile && open ? 'dialog' : undefined}
    aria-modal={mobile && open ? true : undefined}
    aria-label="Admin navigation"
    inert={mobile && !open ? true : undefined}
  >
    <div className="ad-sidebar-brand">
      <AdminLink
        to="/"
        onNavigate={onNavigate}
        preview={preview}
        className="ad-brand"
        aria-label="Nexus admin overview"
      >
        <img src={Logo} alt="" width="40" height="40" />
        <span>
          NEXUS<span>.</span>
          <small>ADMIN WORKSPACE</small>
        </span>
      </AdminLink>
      <button
        className="ad-icon-button ad-close-nav"
        onClick={onClose}
        aria-label="Close navigation"
      >
        <X aria-hidden="true" />
      </button>
    </div>
    <div className="ad-nav-scroll">
      {groups.map((group) => {
        const links = group.links.filter((link) => canVisit(admin, link.key));
        return (
          links.length > 0 && (
            <nav key={group.label} aria-label={group.label}>
              <span className="ad-nav-label">{group.label}</span>
              {links.map((link) => {
                const { key, path, label, icon: Icon } = link;
                return (
                  <AdminLink
                    key={key}
                    to={path}
                    onNavigate={onNavigate}
                    preview={preview}
                    className={`ad-nav-link ${activeSection === key ? 'is-current' : ''}`}
                    aria-current={activeSection === key ? 'page' : undefined}
                  >
                    <Icon aria-hidden="true" />
                    <span>{label}</span>
                    {resources[key] && (
                      <small title={resourceCaption(resources[key])}>
                        {countLabel(resources[key])}
                      </small>
                    )}
                  </AdminLink>
                );
              })}
            </nav>
          )
        );
      })}
    </div>
    <div className="ad-sidebar-foot">
      <div className="ad-workspace-note">
        <span>
          <ShieldCheck aria-hidden="true" />
        </span>
        <div>
          <strong>A little closer, together.</strong>
          <p>Your workspace for the people and journeys behind Nexus.</p>
        </div>
      </div>
      <AdminLink
        to="/profile"
        onNavigate={onNavigate}
        preview={preview}
        className="ad-sidebar-account"
      >
        <span className="ad-avatar">{initials(admin?.name)}</span>
        <span>
          <strong>{admin?.name || 'Your account'}</strong>
          <small>
            {admin?.role === 'superadmin'
              ? 'Super administrator'
              : 'Administrator'}
          </small>
        </span>
        <ArrowUpRight aria-hidden="true" />
      </AdminLink>
    </div>
  </aside>
);
export default Sidebar;
