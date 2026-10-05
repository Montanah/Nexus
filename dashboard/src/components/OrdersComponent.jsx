import { useSearchParams } from 'react-router-dom';
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Package,
  Route,
  Search,
  ShoppingBag,
  X,
} from 'lucide-react';
import AdminLink from './AdminLink';
import { ResourceEmpty, ResourceNotice } from './ResourceState';
import OrderLookups from './OrderLookups';
import {
  orderDate,
  orderStage,
  resourceCaption,
  stageCounts,
} from './overviewModel';
import {
  assignment,
  clientInfo,
  deliveryStages,
  lookupIndexes,
  orderItems,
  orderReference,
  ordersPath,
  ordersSearchParams,
  paymentStatus,
  readOrdersQuery,
  selectOrders,
} from './ordersModel';
import './users.css';
import './orders.css';

export default function OrdersComponent({
  resources,
  onRetry,
  onNavigate,
  preview = false,
}) {
  const [params, setParams] = useSearchParams();
  const query = readOrdersQuery(params),
    resource = resources.orders;
  const hasData = Array.isArray(resource.data),
    orders = hasData ? resource.data : [];
  const indexes = lookupIndexes(resources),
    selected = selectOrders(orders, query, resources, indexes);
  const incompleteNames = ['users', 'travelers', 'products'].some(
    (key) => resources[key]?.status !== 'ready',
  );
  const counts = hasData
    ? { total: orders.length, ...stageCounts(orders) }
    : null;
  const update = (change) =>
    setParams(ordersSearchParams({ ...query, page: 1, ...change }), {
      replace: true,
    });
  const clear = () => setParams({}, { replace: true });
  const filtered =
    query.search ||
    query.client ||
    query.traveler ||
    query.stage !== 'all' ||
    query.payment !== 'all' ||
    query.assignment !== 'all';
  const metrics = [
    { key: 'total', label: 'Total orders', icon: ShoppingBag },
    { key: 'Pending', label: 'Pending orders', icon: Clock3 },
    { key: 'In progress', label: 'In progress', icon: Route },
    { key: 'Complete', label: 'Complete orders', icon: CheckCircle2 },
  ];
  return (
    <div className="au-directory ao-directory">
      <div className="au-intro">
        <div>
          <span className="ad-eyebrow">FROM CONNECTION TO DELIVERY</span>
          <h2>Keep every journey in view.</h2>
          <p>
            Find an order, follow its items, and see who’s carrying it forward.
          </p>
        </div>
        <span className="au-intro-icon" aria-hidden="true">
          <Package />
        </span>
      </div>
      <section className="au-metrics" aria-label="Order totals">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <article key={metric.key}>
              <span>
                <Icon aria-hidden="true" />
              </span>
              <div>
                <h2>{metric.label}</h2>
                <strong>
                  {counts ? counts[metric.key].toLocaleString() : '—'}
                </strong>
              </div>
            </article>
          );
        })}
      </section>
      <div className="au-data-note" role="status">
        <span>All loaded orders · {resourceCaption(resource)}</span>
        <span>Delivery stages follow each order’s items.</span>
      </div>
      {hasData && (
        <ResourceNotice
          resource={resource}
          label="Orders"
          onRetry={() => onRetry('orders')}
        />
      )}
      <OrderLookups resources={resources} onRetry={onRetry} />
      <section className="ad-panel" aria-labelledby="orders-directory-title">
        <div className="au-panel-heading">
          <div>
            <h2 id="orders-directory-title">Order directory</h2>
            <p>
              One row per order. Open an order to review each product and
              traveler.
            </p>
          </div>
          <span className="au-count">
            {hasData
              ? `${orders.length.toLocaleString()} orders`
              : 'Orders unavailable'}
          </span>
        </div>
        <div className="au-toolbar">
          <div className="au-search">
            <Search aria-hidden="true" />
            <label className="ad-visually-hidden" htmlFor="order-search">
              Search orders
            </label>
            <input
              id="order-search"
              type="search"
              value={query.search}
              maxLength={200}
              placeholder="Order reference, person, product, or ID"
              onChange={(event) => update({ search: event.target.value })}
            />
            {query.search && (
              <button
                aria-label="Clear order search"
                onClick={() => update({ search: '' })}
              >
                <X aria-hidden="true" />
              </button>
            )}
          </div>
          <div className="ao-people-filters">
            <label>
              Client name or ID
              <input
                value={query.client}
                maxLength={100}
                onChange={(event) => update({ client: event.target.value })}
                placeholder="Find a client"
              />
            </label>
            <label>
              Traveler name or ID
              <input
                value={query.traveler}
                maxLength={100}
                onChange={(event) => update({ traveler: event.target.value })}
                placeholder="Find a traveler"
              />
            </label>
          </div>
          <div className="au-filter-row">
            <label>
              Delivery stage
              <select
                aria-label="Delivery stage"
                value={query.stage}
                onChange={(event) => update({ stage: event.target.value })}
              >
                <option value="all">All stages</option>
                {deliveryStages.map((stage) => (
                  <option key={stage}>{stage}</option>
                ))}
              </select>
            </label>
            <label>
              Payment status
              <select
                aria-label="Payment status"
                value={query.payment}
                onChange={(event) => update({ payment: event.target.value })}
              >
                <option value="all">All payment states</option>
                {['Pending', 'Paid', 'Failed', 'Unknown'].map((stage) => (
                  <option key={stage}>{stage}</option>
                ))}
              </select>
            </label>
            <label>
              Assignment
              <select
                aria-label="Assignment"
                value={query.assignment}
                onChange={(event) => update({ assignment: event.target.value })}
              >
                <option value="all">All assignments</option>
                {['Unassigned', 'Assigned', 'Mixed', 'Unknown'].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label>
              Sort by
              <select
                aria-label="Sort orders"
                value={query.sort}
                onChange={(event) => update({ sort: event.target.value })}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="reference">Order reference</option>
              </select>
            </label>
            {filtered && (
              <button className="au-clear" onClick={clear}>
                Clear filters
              </button>
            )}
          </div>
        </div>
        {!hasData ? (
          <ResourceEmpty
            resource={resource}
            label="Orders"
            onRetry={() => onRetry('orders')}
          />
        ) : (
          <>
            <div className="au-results-note" role="status">
              <span>
                {selected.total.toLocaleString()} {filtered ? 'matching ' : ''}
                {selected.total === 1 ? 'order' : 'orders'}
              </span>
              <span>
                {resource.status === 'loading'
                  ? 'Refreshing · last loaded orders shown'
                  : 'Payment states are recorded order statuses.'}
              </span>
            </div>
            {selected.rows.length ? (
              <>
                <div
                  className="au-table-wrap"
                  role="region"
                  aria-label="Order records"
                  tabIndex={0}
                >
                  <table className="au-table ao-table">
                    <caption className="ad-visually-hidden">
                      Order records with client, product lines, delivery stage,
                      and payment status
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Order</th>
                        <th scope="col">Client</th>
                        <th scope="col">Products</th>
                        <th scope="col">Delivery</th>
                        <th scope="col">Payment</th>
                        <th scope="col">Created</th>
                        <th scope="col">
                          <span className="ad-visually-hidden">Details</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.rows.map((order) => {
                        const client = clientInfo(order, resources, indexes),
                          items = orderItems(order);
                        return (
                          <tr key={order._id}>
                            <th scope="row">
                              <div className="au-person">
                                <span className="ao-order-icon">
                                  <Package aria-hidden="true" />
                                </span>
                                <div>
                                  <strong>{orderReference(order)}</strong>
                                  <small>ID · {order._id}</small>
                                </div>
                              </div>
                            </th>
                            <td data-label="Client">
                              <span className="ao-client-name">
                                {client.name}
                              </span>
                              <small>
                                {client.id || 'Client ID unavailable'}
                              </small>
                            </td>
                            <td data-label="Products">
                              <span>
                                {items
                                  ? `${items.length} ${items.length === 1 ? 'line' : 'lines'}`
                                  : 'Unavailable'}
                              </span>
                              <small>
                                Assignment: {assignment(order).toLowerCase()}
                              </small>
                            </td>
                            <td data-label="Delivery">
                              <span
                                className={`ad-status ad-status-${orderStage(order).toLowerCase().replaceAll(' ', '-')}`}
                              >
                                {orderStage(order)}
                              </span>
                            </td>
                            <td data-label="Payment">
                              <span className="au-role">
                                {paymentStatus(order)}
                              </span>
                            </td>
                            <td className="au-date" data-label="Created">
                              {orderDate(order.createdAt)}
                            </td>
                            <td>
                              <AdminLink
                                className="au-view-link"
                                to={`/orders/${encodeURIComponent(order._id)}?return=${encodeURIComponent(ordersPath({ ...query, page: selected.page }))}`}
                                onNavigate={onNavigate}
                                preview={preview}
                                aria-label={`View ${orderReference(order)} details`}
                              >
                                View order
                                <ArrowUpRight aria-hidden="true" />
                              </AdminLink>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="au-pagination">
                  <span>
                    Showing {selected.start}–{selected.end} of{' '}
                    {selected.total.toLocaleString()} · 10 per page
                  </span>
                  <nav aria-label="Order directory pages">
                    <button
                      disabled={selected.page === 1}
                      aria-label="Previous page"
                      onClick={() => update({ page: selected.page - 1 })}
                    >
                      <ChevronLeft aria-hidden="true" />
                    </button>
                    <span>
                      Page {selected.page} of {selected.pages}
                    </span>
                    <button
                      disabled={selected.page === selected.pages}
                      aria-label="Next page"
                      onClick={() => update({ page: selected.page + 1 })}
                    >
                      <ChevronRight aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </>
            ) : (
              <div className="ad-empty">
                <span className="ad-empty-icon">
                  {filtered ? (
                    <Search aria-hidden="true" />
                  ) : (
                    <ShoppingBag aria-hidden="true" />
                  )}
                </span>
                <h3>
                  {orders.length
                    ? incompleteNames
                      ? 'No matches in the available order details.'
                      : 'No orders match your filters.'
                    : 'The first order starts the journey.'}
                </h3>
                <p>
                  {orders.length
                    ? incompleteNames
                      ? 'Some names or product details are unavailable. Search by ID or retry the related details above.'
                      : 'Try a different reference, person, or delivery stage.'
                    : 'Orders will appear here when they’re placed.'}
                </p>
                {filtered && (
                  <button
                    className="ad-button ad-button-secondary"
                    onClick={clear}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
