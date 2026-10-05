import { useSearchParams } from 'react-router-dom';
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  Users,
  Route,
  X,
} from 'lucide-react';
import AdminLink from './AdminLink';
import { ResourceEmpty, ResourceNotice } from './ResourceState';
import { initials, resourceCaption } from './overviewModel';
import {
  directoryPath,
  pageSize,
  readUsersQuery,
  selectUsers,
  textValue,
  roleLabel,
  userDate,
  userName,
  userTotals,
  usersSearchParams,
  verification,
  verificationLabel,
} from './usersModel';
import './users.css';

export default function UsersComponent({
  resource,
  onRetry,
  onNavigate,
  preview = false,
}) {
  const [params, setParams] = useSearchParams();
  const query = readUsersQuery(params);
  const hasData = Array.isArray(resource.data);
  const users = hasData ? resource.data : [];
  const totals = hasData ? userTotals(users) : null;
  const selected = selectUsers(users, query);
  const update = (change) =>
    setParams(usersSearchParams({ ...query, page: 1, ...change }), {
      replace: true,
    });
  const clear = () => setParams({}, { replace: true });
  const filtered =
    query.search || query.role !== 'all' || query.verification !== 'all';
  const metrics = [
    { key: 'total', label: 'Registered users', icon: Users },
    { key: 'clients', label: 'Clients', icon: UserRound },
    { key: 'travelers', label: 'Travelers', icon: Route },
    { key: 'verified', label: 'Email verified', icon: ShieldCheck },
  ];
  return (
    <div className="au-directory">
      <div className="au-intro">
        <div>
          <span className="ad-eyebrow">THE PEOPLE BEHIND NEXUS</span>
          <h2>Every connection starts with someone.</h2>
          <p>
            Find an account, check its details, and see the journeys behind it.
          </p>
        </div>
        <span className="au-intro-icon" aria-hidden="true">
          <Users />
        </span>
      </div>
      <section className="au-metrics" aria-label="User totals">
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
                  {totals ? totals[metric.key].toLocaleString() : '—'}
                </strong>
              </div>
            </article>
          );
        })}
      </section>
      <div className="au-data-note" role="status">
        <span>All loaded accounts · {resourceCaption(resource)}</span>
        <span>Verification refers to email.</span>
      </div>
      {hasData && (
        <ResourceNotice resource={resource} label="Users" onRetry={onRetry} />
      )}
      <section
        className="ad-panel au-directory-panel"
        aria-labelledby="user-directory-title"
      >
        <div className="au-panel-heading">
          <div>
            <h2 id="user-directory-title">User directory</h2>
            <p>One place for your platform’s people.</p>
          </div>
          <span className="au-count">
            {hasData
              ? `${users.length.toLocaleString()} accounts`
              : 'Accounts unavailable'}
          </span>
        </div>
        <div className="au-toolbar">
          <div className="au-search">
            <Search aria-hidden="true" />
            <label className="ad-visually-hidden" htmlFor="user-search">
              Search users
            </label>
            <input
              id="user-search"
              type="search"
              value={query.search}
              maxLength={200}
              placeholder="Name, email, phone, or user ID"
              onChange={(event) => update({ search: event.target.value })}
            />
            {query.search && (
              <button
                onClick={() => update({ search: '' })}
                aria-label="Clear user search"
              >
                <X aria-hidden="true" />
              </button>
            )}
          </div>
          <div className="au-filter-row">
            <SlidersHorizontal aria-hidden="true" />
            <label>
              Role
              <select
                value={query.role}
                onChange={(event) => update({ role: event.target.value })}
              >
                <option value="all">All roles</option>
                <option value="client">Clients</option>
                <option value="traveler">Travelers</option>
                <option value="user">Users</option>
                <option value="admin">Admins</option>
                <option value="superAdmin">Super admins</option>
                <option value="unknown">Unknown role</option>
              </select>
            </label>
            <label>
              Email verification
              <select
                value={query.verification}
                onChange={(event) =>
                  update({ verification: event.target.value })
                }
              >
                <option value="all">All states</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
                <option value="unknown">Unknown</option>
              </select>
            </label>
            <label>
              Sort by
              <select
                value={query.sort}
                onChange={(event) => update({ sort: event.target.value })}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="name">Name A–Z</option>
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
          <ResourceEmpty resource={resource} label="Users" onRetry={onRetry} />
        ) : (
          <>
            <div className="au-results-note" role="status" aria-live="polite">
              {filtered
                ? `${selected.total.toLocaleString()} matching ${selected.total === 1 ? 'account' : 'accounts'}`
                : `${users.length.toLocaleString()} ${users.length === 1 ? 'account' : 'accounts'}`}
              <span>
                {resource.status === 'loading'
                  ? 'Refreshing · last loaded accounts shown'
                  : 'Select an account to view its profile.'}
              </span>
            </div>
            {selected.rows.length > 0 ? (
              <>
                <div
                  className="au-table-wrap"
                  role="region"
                  aria-label="User accounts"
                  tabIndex={0}
                >
                  <table className="au-table">
                    <caption className="ad-visually-hidden">
                      User accounts with role, email verification, registration
                      date, and profile links
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">User</th>
                        <th scope="col">Contact</th>
                        <th scope="col">Role</th>
                        <th scope="col">Email verification</th>
                        <th scope="col">Joined</th>
                        <th scope="col">
                          <span className="ad-visually-hidden">Profile</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.rows.map((user) => (
                        <tr key={user._id}>
                          <th scope="row">
                            <div className="au-person">
                              <span className="ad-avatar" aria-hidden="true">
                                {initials(textValue(user.name)).toUpperCase()}
                              </span>
                              <div>
                                <strong>{userName(user)}</strong>
                                <small>ID · {user._id}</small>
                              </div>
                            </div>
                          </th>
                          <td>
                            <span className="au-contact">
                              {textValue(user.email) || 'Email not provided'}
                            </span>
                            <small>
                              {textValue(user.phone_number) ||
                                'Phone not provided'}
                            </small>
                          </td>
                          <td data-label="Role">
                            <span
                              className={`au-role ${user.role === 'traveler' ? 'au-role-traveler' : ''}`}
                            >
                              {roleLabel(user)}
                            </span>
                          </td>
                          <td data-label="Email verification">
                            <span
                              className={`au-verification au-verification-${verification(user)}`}
                            >
                              <span aria-hidden="true" />
                              {verificationLabel(user)}
                            </span>
                          </td>
                          <td className="au-date" data-label="Joined">
                            {userDate(user.createdAt)}
                          </td>
                          <td>
                            <AdminLink
                              className="au-view-link"
                              to={`/users/${encodeURIComponent(user._id)}?return=${encodeURIComponent(directoryPath({ ...query, page: selected.page }))}`}
                              onNavigate={onNavigate}
                              preview={preview}
                              aria-label={`View ${userName(user)} profile`}
                            >
                              View profile
                              <ArrowUpRight aria-hidden="true" />
                            </AdminLink>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="au-pagination">
                  <span>
                    Showing {selected.start}–{selected.end} of{' '}
                    {selected.total.toLocaleString()} · {pageSize} per page
                  </span>
                  <nav aria-label="User directory pages">
                    <button
                      disabled={selected.page === 1}
                      onClick={() => update({ page: selected.page - 1 })}
                      aria-label="Previous page"
                    >
                      <ChevronLeft aria-hidden="true" />
                    </button>
                    <span>
                      Page {selected.page} of {selected.pages}
                    </span>
                    <button
                      disabled={selected.page === selected.pages}
                      onClick={() => update({ page: selected.page + 1 })}
                      aria-label="Next page"
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
                    <Users aria-hidden="true" />
                  )}
                </span>
                <h3>
                  {users.length
                    ? 'No accounts match your filters.'
                    : 'Your community starts here.'}
                </h3>
                <p>
                  {users.length
                    ? 'Try another name, email, or filter to find the account.'
                    : 'Registered users will appear here when they join Nexus.'}
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
