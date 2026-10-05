import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  LockKeyhole,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
} from 'lucide-react';
import AdminLink from './AdminLink';
import OrderLookups from './OrderLookups';
import { ResourceNotice } from './ResourceState';
import {
  canRead,
  orderDate,
  orderStage,
  resourceCaption,
} from './overviewModel';
import { recordedAmount, textValue } from './usersModel';
import {
  assignment,
  clientInfo,
  itemQuantity,
  itemStage,
  lookupIndexes,
  orderItems,
  orderReference,
  paymentStatus,
  productDestination,
  productInfo,
  proofUrl,
  safeOrdersReturn,
  travelerInfo,
} from './ordersModel';
import { useOrderDetails } from '../hooks/useOrderDetails';
import './users.css';
import './orders.css';

const OrderState = ({ resource, onRetry }) => {
  const loading = resource.status === 'loading',
    missing = resource.status === 'missing',
    restricted = resource.status === 'restricted';
  return (
    <section
      className="ad-panel ad-empty"
      role={loading ? 'status' : !missing && !restricted ? 'alert' : undefined}
    >
      <span className="ad-empty-icon">
        {restricted ? (
          <LockKeyhole aria-hidden="true" />
        ) : missing ? (
          <Search aria-hidden="true" />
        ) : (
          <RefreshCw
            aria-hidden="true"
            className={loading ? 'ad-spinning' : ''}
          />
        )}
      </span>
      <h2>
        {loading
          ? 'Loading this order…'
          : missing
            ? 'Order not found.'
            : restricted
              ? 'Order access is restricted.'
              : 'This order couldn’t load.'}
      </h2>
      <p>
        {loading
          ? 'The order and its delivery items will appear when ready.'
          : missing
            ? 'This order could not be found. Return to the directory to find another order.'
            : restricted
              ? 'Contact your administrator if you need access to this order.'
              : 'Check your connection and try again.'}
      </p>
      {!loading && !missing && !restricted && (
        <button className="ad-button ad-button-secondary" onClick={onRetry}>
          Retry order
          <RefreshCw aria-hidden="true" />
        </button>
      )}
    </section>
  );
};
export function OrderDetailsView({
  resource,
  resources,
  admin,
  onRetry,
  onRetryLookup,
  onNavigate,
  backTo = '/orders',
  preview = false,
}) {
  const order = resource.data,
    indexes = lookupIndexes(resources);
  const client = order ? clientInfo(order, resources, indexes) : null;
  const items = order ? orderItems(order) : null;
  return (
    <div className="au-profile ao-detail">
      <div className="au-profile-top">
        <AdminLink
          className="au-back"
          to={backTo}
          onNavigate={onNavigate}
          preview={preview}
        >
          <ArrowLeft aria-hidden="true" />
          Back to orders
        </AdminLink>
        <button
          className="ad-button ad-button-secondary"
          onClick={onRetry}
          disabled={
            resource.status === 'loading' || resource.status === 'restricted'
          }
        >
          <RefreshCw
            aria-hidden="true"
            className={resource.status === 'loading' ? 'ad-spinning' : ''}
          />
          Refresh order
        </button>
      </div>
      {!order ? (
        <OrderState resource={resource} onRetry={onRetry} />
      ) : (
        <>
          <ResourceNotice resource={resource} label="Order" onRetry={onRetry} />
          <section className="au-profile-hero">
            <span className="au-profile-avatar">
              <ShoppingBag aria-hidden="true" />
            </span>
            <div>
              <span className="ad-eyebrow">ORDER DETAILS</span>
              <h2>{orderReference(order)}</h2>
              <p>ID · {order._id}</p>
              <div className="au-profile-tags">
                <span
                  className={`ad-status ad-status-${orderStage(order).toLowerCase().replaceAll(' ', '-')}`}
                >
                  {orderStage(order)}
                </span>
                <span className="ao-assignment">
                  Assignment: {assignment(order).toLowerCase()}
                </span>
              </div>
            </div>
            <span className="au-profile-joined">
              <CalendarDays aria-hidden="true" />
              <span>
                Order created<strong>{orderDate(order.createdAt)}</strong>
              </span>
            </span>
          </section>
          <p className="au-data-note" role="status">
            {resourceCaption(resource)}
          </p>
          <OrderLookups resources={resources} onRetry={onRetryLookup} />
          <div className="ao-detail-grid">
            <section
              className="ad-panel ao-items"
              aria-labelledby="delivery-items-heading"
            >
              <div className="au-panel-heading">
                <div>
                  <h2 id="delivery-items-heading">Delivery items</h2>
                  <p>Each item has its own traveler and delivery stage.</p>
                </div>
                <span className="au-count">
                  {items
                    ? `${items.length} product ${items.length === 1 ? 'line' : 'lines'}`
                    : 'Items unavailable'}
                </span>
              </div>
              {items?.length ? (
                <div className="ao-item-list">
                  {items.map((item, index) => {
                    const product = productInfo(item, resources, indexes),
                      traveler = travelerInfo(item, resources, indexes),
                      proof = proofUrl(item.deliveryProof);
                    return (
                      <article
                        key={`${product.id}-${index}`}
                        className="ao-item"
                      >
                        <div className="ao-item-heading">
                          <span className="ao-order-icon">
                            <Package aria-hidden="true" />
                          </span>
                          <div>
                            <span className="ad-eyebrow">ITEM {index + 1}</span>
                            <h3>{product.name}</h3>
                            <p>
                              {product.id
                                ? `Product ID · ${product.id}`
                                : 'Product ID unavailable'}
                            </p>
                          </div>
                          <span className="au-role">{itemStage(item)}</span>
                        </div>
                        <dl className="ao-item-facts">
                          <div>
                            <dt>Quantity ordered</dt>
                            <dd>{itemQuantity(item)}</dd>
                          </div>
                          <div>
                            <dt>Traveler</dt>
                            <dd>
                              {traveler.name}
                              {traveler.id && <small>ID · {traveler.id}</small>}
                              {traveler.id && canRead(admin, 'travelers') && (
                                <AdminLink
                                  to={`/travelers/${encodeURIComponent(traveler.id)}`}
                                  onNavigate={onNavigate}
                                  preview={preview}
                                  className="au-view-link"
                                >
                                  View traveler
                                  <ArrowUpRight aria-hidden="true" />
                                </AdminLink>
                              )}
                            </dd>
                          </div>
                          <div>
                            <dt>Destination · current listing</dt>
                            <dd>{productDestination(product.record)}</dd>
                          </div>
                          <div>
                            <dt>Delivery date · current listing</dt>
                            <dd>{orderDate(product.record?.deliverydate)}</dd>
                          </div>
                          <div>
                            <dt>Delivery proof</dt>
                            <dd>
                              {proof ? (
                                <a
                                  href={proof}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="au-view-link"
                                >
                                  View proof
                                  <span className="ad-visually-hidden">
                                    {' '}
                                    (opens in a new tab)
                                  </span>
                                  <ArrowUpRight aria-hidden="true" />
                                </a>
                              ) : textValue(item.deliveryProof) ? (
                                'Recorded · preview unavailable'
                              ) : item.deliveryProof === null ? (
                                'Not provided'
                              ) : (
                                'Unavailable'
                              )}
                            </dd>
                          </div>
                        </dl>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="ad-empty">
                  <span className="ad-empty-icon">
                    <Package aria-hidden="true" />
                  </span>
                  <h3>
                    {items === null
                      ? 'Delivery items unavailable.'
                      : 'No delivery items returned.'}
                  </h3>
                  <p>
                    {items === null
                      ? 'The item details could not be confirmed from this order. Refresh to try again.'
                      : 'This order contains no delivery items in the loaded record.'}
                  </p>
                  {items === null && (
                    <button
                      className="ad-button ad-button-secondary"
                      onClick={onRetry}
                    >
                      Refresh order
                      <RefreshCw aria-hidden="true" />
                    </button>
                  )}
                </div>
              )}
            </section>
            <aside className="ao-detail-side">
              <section className="ad-panel">
                <div className="au-panel-heading">
                  <div>
                    <span className="ad-eyebrow">
                      THE PERSON BEHIND THE ORDER
                    </span>
                    <h2>Client</h2>
                  </div>
                </div>
                <div className="ao-client-card">
                  <strong>{client.name}</strong>
                  <p>{client.id || 'Client ID unavailable'}</p>
                  {client.id && canRead(admin, 'users') && (
                    <AdminLink
                      className="au-view-link"
                      to={`/users/${encodeURIComponent(client.id)}`}
                      onNavigate={onNavigate}
                      preview={preview}
                    >
                      View client profile
                      <ArrowUpRight aria-hidden="true" />
                    </AdminLink>
                  )}
                </div>
              </section>
              <section className="ad-panel">
                <div className="au-panel-heading">
                  <div>
                    <span className="ad-eyebrow">AS RECORDED ON THE ORDER</span>
                    <h2>Payment summary</h2>
                  </div>
                </div>
                <dl className="ao-summary">
                  <div>
                    <dt>Recorded order total</dt>
                    <dd className="ao-total">
                      {recordedAmount(order.totalAmount)}
                    </dd>
                  </div>
                  <div>
                    <dt>Payment status</dt>
                    <dd>{paymentStatus(order)}</dd>
                  </div>
                  <div>
                    <dt>Payment method</dt>
                    <dd>
                      {['Mpesa', 'Airtel', 'Stripe', 'Paystack'].includes(
                        order.paymentMethod,
                      )
                        ? order.paymentMethod
                        : 'Unavailable'}
                    </dd>
                  </div>
                </dl>
                <p className="ao-summary-note">
                  Currency is not supplied with this order. This status does not
                  confirm a traveler payout.
                </p>
                {canRead(admin, 'payments') && (
                  <AdminLink
                    to="/payments"
                    onNavigate={onNavigate}
                    preview={preview}
                    className="au-view-link ao-payments-link"
                  >
                    Open payments
                    <ArrowUpRight aria-hidden="true" />
                  </AdminLink>
                )}
              </section>
              <section className="ad-panel ao-stage-note">
                <h3>Following the delivery</h3>
                <p>
                  An order stays in progress while its items are assigned,
                  shipped, delivered, or awaiting confirmation. Completed items
                  are marked Complete. Cancelled items are excluded when
                  assessing the remaining delivery.
                </p>
              </section>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
export default function OrderDetails({ resources, admin, onRetry }) {
  const { orderId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { resource, retry } = useOrderDetails(orderId);
  return (
    <OrderDetailsView
      resource={resource}
      resources={resources}
      admin={admin}
      onRetry={retry}
      onRetryLookup={onRetry}
      onNavigate={navigate}
      backTo={safeOrdersReturn(params.get('return'))}
    />
  );
}
