import { ResourceNotice } from './ResourceState';

export default function OrderLookups({ resources, onRetry }) {
  const labels = {
    users: 'Client and traveler names',
    travelers: 'Traveler assignments',
    products: 'Product details',
  };
  return (
    <div className="ao-lookups">
      {Object.entries(labels).map(([key, label]) => {
        const resource = resources[key];
        return resource?.status === 'error' ? (
          <ResourceNotice
            key={key}
            resource={resource}
            label={label}
            onRetry={() => onRetry(key)}
          />
        ) : resource?.status === 'restricted' ? (
          <p key={key} className="ao-lookup-note">
            {label} are restricted for this account.
          </p>
        ) : resource?.status === 'loading' ? (
          <p key={key} className="ao-lookup-note" role="status">
            {resource.data
              ? `Refreshing ${label.toLowerCase()}. Last loaded details are shown.`
              : `Loading ${label.toLowerCase()}…`}
          </p>
        ) : null;
      })}
    </div>
  );
}
