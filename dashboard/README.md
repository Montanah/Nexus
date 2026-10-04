# Nexus admin workspace

The admin app lives in `dashboard/`. The customer and traveler app lives in
`frontend/`. Commands below run from the repository root with Node 22.12+.

```sh
npm --prefix dashboard ci
npm --prefix dashboard run dev -- --port 5174 --strictPort
```

Open `http://localhost:5174` for the authenticated workspace. Development API
requests use the existing `/api` proxy in `dashboard/vite.config.js`, which
currently targets the hosted backend. Running the admin app alone does not
start a backend or create an admin account.

## Review without the backend

Open `http://localhost:5174/preview/overview`. This development-only page shows
labeled sample data and makes no API requests. It does not create a session or
write account data. Preview navigation explains destinations; Analytics is also
available for review. Theme selection is saved locally.

The **Preview state** control covers sample data, empty results, loading, partial
failure, complete failure, failed refresh with older data, orders-only access,
and revoked access. Retry and refresh simulate recovery; **Reset preview** restores
the initial samples. The route and fixtures are excluded from production builds.

## Overview data

- Counts use the complete, unpaginated lists currently returned by the users,
  products, orders, and travelers endpoints. If the API adds pagination, counts
  must use server totals before displaying an overall count.
- Missing or malformed collections fail visibly. An empty array is a real zero;
  unavailable data displays an em dash. Each resource loads and retries independently.
- Refresh failures retain the previous snapshot and mark it as last loaded.
  HTTP 403 clears cached records and shows restricted access. HTTP 401 uses the
  existing authentication redirect. In-flight reads are cancelled on unmount.
- Collection reads and navigation follow explicit read permissions. Admin
  management follows the backend's superadministrator role requirement. These UI
  checks do not replace server authorization.
- Recent orders use actual creation dates. Delivery stages use item statuses,
  with the parent as a fallback when there are no items. Parent cancellation takes
  precedence. Delivered and confirmation stages remain in progress until complete;
  unknown statuses remain unknown. Cancelled items are excluded when aggregating
  the remaining items, and all-cancelled orders are cancelled.
- Fabricated activity, growth percentages, and analytics figures have been removed.
  Analytics marks revenue, delivery rate, and monthly growth as unavailable until
  an appropriate reporting source exists. Shared legacy stat cards no longer
  display hardcoded growth badges.

The overview and shared shell use local CSS, support light/dark themes, and include
keyboard-accessible mobile navigation. Existing management-page bodies still use
the Tailwind CDN and retain their prior behavior. Their detailed financial
calculations and page-specific loaders are outside this overview refresh.
The redundant CDN React, React DOM, and Axios scripts have been removed; the
application uses its installed versions.

## Validation

```sh
node --test dashboard/test/overview.test.mjs
npm --prefix dashboard run build
```

The model tests cover permission rules, response validation, unknown vs. zero
counts, stale snapshots, access revocation, order stages, sorting, and route labels.
Browser validation should also cover mobile navigation/focus, both themes,
resource retries, partial failure, and authenticated management-route transitions.
Live account authentication and backend persistence require separate verification
against a configured backend.
