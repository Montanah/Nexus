import { AlertCircle, LockKeyhole, RefreshCw } from 'lucide-react';
export const ResourceNotice = ({ resource, label, onRetry }) =>
  resource?.status === 'error' ? (
    <div className="ad-resource-notice" role="alert">
      <AlertCircle aria-hidden="true" />
      <span>
        {label} couldn’t load.
        {resource.data && ' Showing the last loaded data.'}
      </span>
      <button onClick={onRetry}>Retry {label.toLowerCase()}</button>
    </div>
  ) : null;
export const ResourceEmpty = ({ resource, label, onRetry }) => {
  const restricted = resource?.status === 'restricted',
    loading = resource?.status === 'loading';
  return (
    <div className="ad-empty" role={loading ? 'status' : undefined}>
      <span className="ad-empty-icon">
        {restricted ? (
          <LockKeyhole aria-hidden="true" />
        ) : (
          <RefreshCw
            aria-hidden="true"
            className={loading ? 'ad-spinning' : ''}
          />
        )}
      </span>
      <h3>
        {restricted
          ? `${label} access is restricted.`
          : loading
            ? `Loading ${label.toLowerCase()}…`
            : `${label} couldn’t load.`}
      </h3>
      <p>
        {restricted
          ? 'This information isn’t available to your account. Contact your administrator if you need access.'
          : loading
            ? 'Your information will appear here when it’s ready.'
            : 'Check your connection and try again. No totals are available yet.'}
      </p>
      {!restricted && !loading && (
        <button className="ad-button ad-button-secondary" onClick={onRetry}>
          Retry {label.toLowerCase()}
          <RefreshCw aria-hidden="true" />
        </button>
      )}
    </div>
  );
};
