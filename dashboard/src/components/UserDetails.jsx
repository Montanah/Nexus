import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  LockKeyhole,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  UserRound,
} from 'lucide-react';
import AdminLink from './AdminLink';
import { ResourceNotice } from './ResourceState';
import { initials, orderStage, resourceCaption } from './overviewModel';
import {
  recordedAmount,
  roleLabel,
  safeUsersReturn,
  textValue,
  userDate,
  userName,
  verification,
  verificationLabel,
} from './usersModel';
import { useUserDetails } from '../hooks/useUserDetails';
import './users.css';

const ProfileState = ({ resource, onRetry }) => {
  const loading = resource.status === 'loading',
    missing = resource.status === 'missing',
    restricted = resource.status === 'restricted';
  return (
    <section
      className="ad-panel ad-empty au-profile-state"
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
          ? 'Loading this profile…'
          : missing
            ? 'User not found.'
            : restricted
              ? 'Profile access is restricted.'
              : 'This profile couldn’t load.'}
      </h2>
      <p>
        {loading
          ? 'The account details will appear when they’re ready.'
          : missing
            ? 'This account could not be found. Return to the directory to find another user.'
            : restricted
              ? 'Contact your administrator if you need access to this account.'
              : 'Check your connection and try again.'}
      </p>
      {!loading && !missing && !restricted && (
        <button className="ad-button ad-button-secondary" onClick={onRetry}>
          Retry profile
          <RefreshCw aria-hidden="true" />
        </button>
      )}
    </section>
  );
};
const HistoryEmpty = ({ records, noun, onRetry }) => (
  <div className="ad-empty">
    <span className="ad-empty-icon">
      {noun === 'orders' ? (
        <ShoppingBag aria-hidden="true" />
      ) : (
        <CreditCard aria-hidden="true" />
      )}
    </span>
    <h3>
      {records === null
        ? `${noun === 'orders' ? 'Order history' : 'Payment records'} unavailable.`
        : `No ${noun} yet.`}
    </h3>
    <p>
      {records === null
        ? 'This information wasn’t included in the loaded profile. Refresh to try again.'
        : `No ${noun} were returned for this account.`}
    </p>
    {records === null && (
      <button className="ad-button ad-button-secondary" onClick={onRetry}>
        Refresh profile
        <RefreshCw aria-hidden="true" />
      </button>
    )}
  </div>
);
export function UserProfileView({
  resource,
  onRetry,
  onNavigate,
  backTo = '/users',
  preview = false,
}) {
  const [section, setSection] = useState('profile');
  const data = resource.data;
  const user = data?.user;
  const sections = [
    { key: 'profile', label: 'Profile', icon: UserRound },
    {
      key: 'orders',
      label: 'Orders',
      count: data?.orders?.length ?? '—',
      icon: ShoppingBag,
    },
    {
      key: 'payments',
      label: 'Payment records',
      count: data?.payments?.length ?? '—',
      icon: CreditCard,
    },
  ];
  return (
    <div className="au-profile">
      <div className="au-profile-top">
        <AdminLink
          className="au-back"
          to={backTo}
          onNavigate={onNavigate}
          preview={preview}
        >
          <ArrowLeft aria-hidden="true" />
          Back to users
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
          Refresh profile
        </button>
      </div>
      {!data ? (
        <ProfileState resource={resource} onRetry={onRetry} />
      ) : (
        <>
          <ResourceNotice
            resource={resource}
            label="Profile"
            onRetry={onRetry}
          />
          <section className="au-profile-hero">
            <span className="au-profile-avatar" aria-hidden="true">
              {initials(textValue(user.name)).toUpperCase()}
            </span>
            <div>
              <span className="ad-eyebrow">ACCOUNT PROFILE</span>
              <h2>{userName(user)}</h2>
              <p>{textValue(user.email) || 'Email not provided'}</p>
              <div className="au-profile-tags">
                <span className="au-role">{roleLabel(user)}</span>
                <span
                  className={`au-verification au-verification-${verification(user)}`}
                >
                  <span aria-hidden="true" />
                  Email {verificationLabel(user).toLowerCase()}
                </span>
              </div>
            </div>
            <span className="au-profile-joined">
              <CalendarDays aria-hidden="true" />
              <span>
                Joined Nexus<strong>{userDate(user.createdAt)}</strong>
              </span>
            </span>
          </section>
          <p className="au-data-note" role="status">
            {resourceCaption(resource)}
          </p>
          <section className="ad-panel au-profile-panel">
            <nav className="au-profile-tabs" aria-label="Profile sections">
              {sections.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    aria-pressed={section === item.key}
                    onClick={() => setSection(item.key)}
                  >
                    <Icon aria-hidden="true" />
                    {item.label}
                    {item.count !== undefined && <span>{item.count}</span>}
                  </button>
                );
              })}
            </nav>
            {section === 'profile' && (
              <div className="au-profile-info">
                <section>
                  <div className="au-info-heading">
                    <UserRound aria-hidden="true" />
                    <div>
                      <h3>Account information</h3>
                      <p>The details provided by this user.</p>
                    </div>
                  </div>
                  <dl className="au-details-list">
                    {[
                      ['Full name', userName(user)],
                      ['Email', textValue(user.email) || 'Not provided'],
                      ['Phone', textValue(user.phone_number) || 'Not provided'],
                      ['Role', roleLabel(user)],
                      ['User ID', user._id],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
                <section>
                  <div className="au-info-heading">
                    <ShieldCheck aria-hidden="true" />
                    <div>
                      <h3>Verification & dates</h3>
                      <p>Recorded account settings and dates.</p>
                    </div>
                  </div>
                  <dl className="au-details-list">
                    {[
                      ['Email verification', verificationLabel(user)],
                      [
                        'Two-factor authentication',
                        user.is2FAEnabled === true
                          ? 'Enabled'
                          : user.is2FAEnabled === false
                            ? 'Disabled'
                            : 'Not available',
                      ],
                      ['Registered', userDate(user.createdAt)],
                      ['Last updated', userDate(user.updatedAt)],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              </div>
            )}
            {section === 'orders' && (
              <section className="au-history">
                <div className="au-panel-heading">
                  <div>
                    <h3>Order history</h3>
                    <p>Orders placed by this account.</p>
                  </div>
                </div>
                {data.orders?.length ? (
                  <div className="au-history-list">
                    {data.orders.map((order) => (
                      <article key={order._id}>
                        <div className="au-history-top">
                          <span className="au-history-icon">
                            <ShoppingBag aria-hidden="true" />
                          </span>
                          <div>
                            <h4>
                              {textValue(order.orderNumber) ||
                                'Reference unavailable'}
                            </h4>
                            <p>{userDate(order.createdAt)}</p>
                          </div>
                          <span
                            className={`ad-status ad-status-${orderStage(order).toLowerCase().replaceAll(' ', '-')}`}
                          >
                            {orderStage(order)}
                          </span>
                        </div>
                        <dl>
                          <div>
                            <dt>Product lines</dt>
                            <dd>
                              {Array.isArray(order.items)
                                ? order.items.length
                                : 'Not available'}
                            </dd>
                          </div>
                          <div>
                            <dt>Order ID</dt>
                            <dd>{order._id}</dd>
                          </div>
                        </dl>
                      </article>
                    ))}
                  </div>
                ) : (
                  <HistoryEmpty
                    records={data.orders}
                    noun="orders"
                    onRetry={onRetry}
                  />
                )}
              </section>
            )}
            {section === 'payments' && (
              <section className="au-history">
                <div className="au-panel-heading">
                  <div>
                    <h3>Payment records</h3>
                    <p>
                      Amounts are shown as recorded. Currency is not supplied
                      with these records.
                    </p>
                  </div>
                </div>
                {data.payments?.length ? (
                  <div className="au-history-list">
                    {data.payments.map((payment) => (
                      <article key={payment._id}>
                        <div className="au-history-top">
                          <span className="au-history-icon">
                            <CreditCard aria-hidden="true" />
                          </span>
                          <div>
                            <h4>
                              {textValue(payment.paymentLogsId) ||
                                'Reference unavailable'}
                            </h4>
                            <p>{userDate(payment.createdAt)}</p>
                          </div>
                          <span className="au-role">
                            {['Paid', 'Pending', 'Failed'].includes(
                              payment.status,
                            )
                              ? payment.status
                              : 'Unknown status'}
                          </span>
                        </div>
                        <dl>
                          <div>
                            <dt>Recorded amount</dt>
                            <dd>{recordedAmount(payment.amount)}</dd>
                          </div>
                          <div>
                            <dt>Method</dt>
                            <dd>
                              {textValue(payment.paymentMethod) ||
                                'Not available'}
                            </dd>
                          </div>
                          <div>
                            <dt>Order reference</dt>
                            <dd>
                              {textValue(payment.orderNumber) ||
                                'Not available'}
                            </dd>
                          </div>
                        </dl>
                      </article>
                    ))}
                  </div>
                ) : (
                  <HistoryEmpty
                    records={data.payments}
                    noun="payment records"
                    onRetry={onRetry}
                  />
                )}
              </section>
            )}
          </section>
        </>
      )}
    </div>
  );
}
export default function UserDetails() {
  const { userId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { resource, retry } = useUserDetails(userId);
  return (
    <UserProfileView
      key={userId}
      resource={resource}
      onRetry={retry}
      onNavigate={navigate}
      backTo={safeUsersReturn(params.get('return'))}
    />
  );
}
