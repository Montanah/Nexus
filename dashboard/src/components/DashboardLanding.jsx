import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  Circle,
  Clock3,
  Package,
  Route,
  ShoppingBag,
  Users,
} from 'lucide-react';
import AdminLink from './AdminLink';
import { ResourceNotice, ResourceEmpty } from './ResourceState';
import {
  canRead,
  canVisit,
  countLabel,
  resourceCaption,
  stageCounts,
  recentOrders,
  orderDate,
  orderStage,
} from './overviewModel';

const metrics = [
  {
    key: 'users',
    label: 'Registered users',
    noun: 'user accounts',
    icon: Users,
  },
  {
    key: 'products',
    label: 'Product listings',
    noun: 'listed products',
    icon: Package,
  },
  {
    key: 'orders',
    label: 'Total orders',
    noun: 'orders placed',
    icon: ShoppingBag,
  },
  {
    key: 'travelers',
    label: 'Traveler profiles',
    noun: 'traveler profiles',
    icon: Route,
  },
];
export const OverviewMetrics = ({
  admin,
  resources,
  onRetry,
  onNavigate,
  preview,
}) => (
  <section className="ad-metrics" aria-label="Platform totals">
    {metrics
      .filter((metric) => canRead(admin, metric.key))
      .map((metric) => {
        const { key, label, noun, icon: Icon } = metric;
        const resource = resources[key];
        return (
          <article
            key={key}
            className={`ad-metric ad-metric-${key}`}
            aria-label={label}
          >
            <div className="ad-metric-top">
              <span className="ad-metric-icon">
                <Icon aria-hidden="true" />
              </span>
              <AdminLink
                to={`/${key}`}
                onNavigate={onNavigate}
                preview={preview}
                className="ad-metric-link"
                aria-label={`View ${key}`}
              >
                <ArrowUpRight aria-hidden="true" />
              </AdminLink>
            </div>
            <h2>{label}</h2>
            <strong className="ad-metric-value">{countLabel(resource)}</strong>
            <span className="ad-metric-noun">{noun}</span>
            <div
              className={`ad-metric-state ${resource.status === 'error' ? 'is-error' : ''}`}
            >
              <span aria-hidden="true" />
              {resourceCaption(resource)}
              {resource.status === 'error' && (
                <button onClick={() => onRetry(key)}>Retry {key}</button>
              )}
            </div>
          </article>
        );
      })}
  </section>
);
const DashboardLanding = ({
  admin,
  resources,
  onRetry,
  onNavigate,
  preview,
}) => {
  const orders = resources.orders;
  const canSeeOrders = canRead(admin, 'orders');
  const breakdown = orders.data ? stageCounts(orders.data) : null;
  const latest = orders.data ? recentOrders(orders.data) : [];
  const links = [
    {
      resource: 'orders',
      label: 'Review orders',
      description: 'Follow the next step in every delivery.',
      icon: ShoppingBag,
    },
    {
      resource: 'users',
      label: 'Manage users',
      description: 'See the people behind each connection.',
      icon: Users,
    },
    {
      resource: 'travelers',
      label: 'View travelers',
      description: 'Keep your delivery community in view.',
      icon: Route,
    },
  ].filter((link) => canVisit(admin, link.resource));
  const accessible = metrics.filter((metric) => canRead(admin, metric.key));
  return (
    <div className="ad-overview">
      <header className="ad-overview-heading">
        <div>
          <span className="ad-eyebrow">A LITTLE CLOSER TO THE BIG PICTURE</span>
          <h1>
            Your platform,
            <br className="ad-mobile-break" /> at a glance<span>.</span>
          </h1>
          <p>
            Welcome back{admin?.name ? `, ${admin.name.split(' ')[0]}` : ''}.
            Here’s where things stand across Nexus.
          </p>
        </div>
        <time
          className="ad-date"
          dateTime={new Date().toISOString().slice(0, 10)}
        >
          <CalendarDays aria-hidden="true" />
          {new Date().toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </time>
      </header>
      <section className="ad-welcome">
        <div>
          <span className="ad-eyebrow">PEOPLE. PARCELS. POSSIBILITIES.</span>
          <h2>
            Every connection
            <br />
            starts with a clear view.
          </h2>
          <p>
            Keep track of your platform’s people, products, and orders. All in
            one place.
          </p>
          {canSeeOrders && (
            <AdminLink
              to="/orders"
              onNavigate={onNavigate}
              preview={preview}
              className="ad-button ad-button-primary"
            >
              View orders
              <ArrowUpRight aria-hidden="true" />
            </AdminLink>
          )}
        </div>
        <div className="ad-journey-art" aria-hidden="true">
          <span className="ad-art-orbit" />
          <span className="ad-art-orbit ad-art-orbit-two" />
          <span className="ad-art-node ad-art-person">
            <Users />
          </span>
          <span className="ad-art-node ad-art-route">
            <Route />
          </span>
          <span className="ad-art-parcel">
            <Package />
          </span>
          <span className="ad-art-tag">
            <span>
              <Check />
            </span>
            A world of connections.
          </span>
          <span className="ad-art-caption">GOOD THINGS TRAVEL TOGETHER</span>
        </div>
      </section>
      {accessible.length ? (
        <>
          <div className="ad-section-label">
            <h2>Platform snapshot</h2>
            <span>All records · latest loaded data</span>
          </div>
          <OverviewMetrics
            admin={admin}
            resources={resources}
            onRetry={onRetry}
            onNavigate={onNavigate}
            preview={preview}
          />
        </>
      ) : (
        <section className="ad-panel ad-access-note">
          <h2>Your workspace is ready.</h2>
          <p>
            Your account doesn’t have access to overview data yet. Use the
            available navigation or contact your administrator to request
            access.
          </p>
        </section>
      )}
      <div
        className={`ad-overview-grid ${!canSeeOrders ? 'ad-no-orders' : ''}`}
      >
        {canSeeOrders && (
          <section
            className="ad-panel ad-recent"
            aria-labelledby="recent-orders-heading"
          >
            <div className="ad-panel-heading">
              <div>
                <span className="ad-eyebrow">THE LATEST CONNECTIONS</span>
                <h2 id="recent-orders-heading">Recent orders</h2>
                <p>The five newest orders in your loaded records.</p>
              </div>
              <AdminLink
                to="/orders"
                onNavigate={onNavigate}
                preview={preview}
                className="ad-text-link"
              >
                View all
                <ArrowUpRight aria-hidden="true" />
              </AdminLink>
            </div>
            {orders.data ? (
              <>
                <ResourceNotice
                  resource={orders}
                  label="Orders"
                  onRetry={() => onRetry('orders')}
                />
                {orders.status === 'loading' && (
                  <p className="ad-updating" role="status">
                    Refreshing orders. Your last loaded records are shown below.
                  </p>
                )}
                {latest.length ? (
                  <div
                    className="ad-table-wrap"
                    role="region"
                    aria-label="Recent orders table"
                    tabIndex={0}
                  >
                    <table className="ad-orders-table">
                      <caption className="ad-visually-hidden">
                        Recent orders, sorted by creation date
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col">Order</th>
                          <th scope="col">Created</th>
                          <th scope="col">Products</th>
                          <th scope="col">Delivery</th>
                        </tr>
                      </thead>
                      <tbody>
                        {latest.map((order) => (
                          <tr key={order._id}>
                            <th scope="row">
                              <span className="ad-order-icon">
                                <Package aria-hidden="true" />
                              </span>
                              {order.orderNumber || 'Reference unavailable'}
                            </th>
                            <td>{orderDate(order.createdAt)}</td>
                            <td>
                              {Array.isArray(order.items)
                                ? order.items.length
                                : '—'}
                            </td>
                            <td>
                              <span
                                className={`ad-status ad-status-${orderStage(order).toLowerCase().replaceAll(' ', '-')}`}
                              >
                                {orderStage(order)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="ad-empty">
                    <span className="ad-empty-icon">
                      <ShoppingBag aria-hidden="true" />
                    </span>
                    <h3>The first order starts the story.</h3>
                    <p>
                      No orders have been returned yet. New orders will appear
                      here when they’re placed.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <ResourceEmpty
                resource={orders}
                label="Orders"
                onRetry={() => onRetry('orders')}
              />
            )}
          </section>
        )}
        <aside className="ad-overview-side">
          {canSeeOrders && (
            <section
              className="ad-panel ad-progress"
              aria-labelledby="order-stages-heading"
            >
              <div className="ad-panel-heading">
                <div>
                  <span className="ad-eyebrow">ALONG THE WAY</span>
                  <h2 id="order-stages-heading">Order stages</h2>
                  <p>Based on each order’s delivery items.</p>
                </div>
                <Route aria-hidden="true" />
              </div>
              {breakdown ? (
                <>
                  <div className="ad-progress-total">
                    <strong>{orders.data.length.toLocaleString()}</strong>
                    <span>loaded orders</span>
                    <span className="ad-progress-icon">
                      <ShoppingBag aria-hidden="true" />
                    </span>
                  </div>
                  <div className="ad-stage-list">
                    {Object.entries(breakdown)
                      .filter(
                        ([stage, count]) => stage !== 'Unknown' || count > 0,
                      )
                      .map(([stage, count]) => (
                        <div key={stage}>
                          <div>
                            <span>
                              <Circle aria-hidden="true" />
                              {stage}
                            </span>
                            <strong>{count.toLocaleString()}</strong>
                          </div>
                          <div
                            className={`ad-stage-track ad-stage-${stage.toLowerCase().replaceAll(' ', '-')}`}
                            aria-hidden="true"
                          >
                            <span
                              style={{
                                width: `${orders.data.length ? (count / orders.data.length) * 100 : 0}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                  <p className="ad-data-caption">{resourceCaption(orders)}</p>
                </>
              ) : (
                <ResourceEmpty
                  resource={orders}
                  label="Order stages"
                  onRetry={() => onRetry('orders')}
                />
              )}
            </section>
          )}
          {links.length > 0 && (
            <section className="ad-panel ad-quick">
              <div className="ad-panel-heading">
                <div>
                  <span className="ad-eyebrow">YOUR NEXT STEP</span>
                  <h2>Quick links</h2>
                </div>
                <Clock3 aria-hidden="true" />
              </div>
              {links.map((link) => {
                const { resource, label, description, icon: Icon } = link;
                return (
                  <AdminLink
                    key={resource}
                    to={`/${resource}`}
                    onNavigate={onNavigate}
                    preview={preview}
                    className="ad-quick-link"
                  >
                    <span>
                      <Icon aria-hidden="true" />
                    </span>
                    <span>
                      <strong>{label}</strong>
                      <small>{description}</small>
                    </span>
                    <ArrowRight aria-hidden="true" />
                  </AdminLink>
                );
              })}
            </section>
          )}
        </aside>
      </div>
    </div>
  );
};
export default DashboardLanding;
