import { ArrowUpRight, ChartNoAxesCombined } from 'lucide-react';
import AdminLink from './AdminLink';

export default function AnalyticsComponent({ onNavigate, preview = false }) {
  return (
    <section className="ad-panel ad-analytics-unavailable">
      <span className="ad-empty-icon">
        <ChartNoAxesCombined aria-hidden="true" />
      </span>
      <span className="ad-eyebrow">PERFORMANCE REPORTING</span>
      <h2>More insight starts with reliable data.</h2>
      <p>
        Revenue, delivery rates, and growth comparisons aren’t available in the
        current reporting data. These figures will appear when reporting is
        connected.
      </p>
      <dl className="ad-unavailable-metrics">
        {['Revenue', 'Delivery rate', 'Monthly growth'].map((label) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>Unavailable</dd>
          </div>
        ))}
      </dl>
      <AdminLink
        className="ad-button ad-button-primary"
        to="/"
        onNavigate={onNavigate}
        preview={preview}
      >
        View platform counts
        <ArrowUpRight aria-hidden="true" />
      </AdminLink>
    </section>
  );
}
