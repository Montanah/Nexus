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

## User directory and profiles

Open `http://localhost:5174/preview/users` to review the Users pages without a
backend. The Overview preview's Users links also open this preview. Sample
accounts support search by name, email, phone, and ID; role and verification
filters; sorting; ten accounts per page; and profile navigation. Preview controls
include empty/loading/failure states, stale data, restricted access, missing users,
and incomplete history. Retry actions simulate recovery. The route and fixtures
are excluded from production.

The real `/users` directory uses the shared users resource. Search, filters, sort,
and page are stored in the URL. View profile carries a validated return path so
Back to users restores the directory choices. Summary counts describe all loaded
accounts, independently of the current filters. Missing verification and unknown
roles remain unknown; missing dates never fall back to today's date.

Profiles load independently through `/api/admin/user/:id`. Requests are cancelled
when switching profiles. A 404 shows User not found; a failed request offers retry;
a failed refresh retains and labels the last snapshot. Access revocation clears
cached profile data. Missing or malformed order/payment histories are shown as
unavailable rather than empty. The endpoint must identify the requested user.
Payment logs show their supplied reference, method, amount, and status, without
inventing a currency or aggregating an unsupported total spent.

User pages are read-only. The former directory Delete button only changed local
state, and profile Edit/Block buttons had no handlers; those controls have been
removed. This pass adds no account mutation endpoints or backend behavior.

## Order directory and details

Open `http://localhost:5174/preview/orders` for the development-only Orders
preview. Overview and Users previews link to it through shared navigation.
Sample orders support search, client/traveler filters, delivery/payment/assignment
filters, sorting, pagination, and item-level detail review. Preview controls cover
empty, loading, failure, stale refresh, failed related details, orders-only access,
revoked access, missing orders, and incomplete data. No API requests, deletions, or
payment operations are performed. Preview code and fixtures are excluded from
production builds.

The real `/orders` page displays one row per order and counts whole orders using
the same delivery-stage rules as Overview. Delivery and payment statuses are
separate. Name searches use Users for clients and Traveler → Users for travelers;
order, user, product, and traveler IDs remain searchable when related details are
unavailable. All filters, sorting, and pagination are URL-backed and survive the
Back to orders link from details. Failed/restricted related collections are
explicitly labeled; empty search results explain when names are unavailable.

`/orders/:orderId` now loads the existing individual-order endpoint independently
of the orders collection. It validates the returned ID, cancels superseded
requests, distinguishes 404/403 from request errors, and retains the last snapshot
after refresh failures. Quantities come from order items, while destination and
delivery-date details are labeled as current product listings. Missing item arrays,
unknown statuses, missing amounts, and absent dates stay unavailable. Proof links
accept HTTPS URLs without embedded credentials and open separately. Client,
traveler, and Payments links respect read permissions.

The recorded order total is shown once without assuming a currency, revenue, or
traveler payout. The old Process Payment action divided totals equally across items,
selected the first completed item, and only tracked completion in local state.
The Delete route uses `:id`, while its handler reads `orderId` and deletes using
a field not present in the order schema. Those actions are removed from the Orders
UI pending backend fixes. Existing payment-management routes are unchanged; this
pass adds no backend writes or mutation endpoints.

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

The overview, Users and Orders pages, and shared shell use local CSS, support light/dark themes, and include
keyboard-accessible mobile navigation. Other existing management-page bodies still use
the Tailwind CDN and retain their prior behavior. Their detailed financial
calculations and page-specific loaders are outside this overview refresh.
The redundant CDN React, React DOM, and Axios scripts have been removed; the
application uses its installed versions.

## Validation

```sh
node --test dashboard/test/*.test.mjs
npm --prefix dashboard run build
```

The model tests cover permission rules, response validation, unknown vs. zero
counts, stale snapshots, access revocation, order stages, sorting, and route labels.
Browser validation should also cover mobile navigation/focus, both themes,
resource retries, partial failure, and authenticated management-route transitions.
Live account authentication and backend persistence require separate verification
against a configured backend.
