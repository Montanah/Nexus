A repository for Nexus - a tech logistics app that enables eaiser delivery and wide access of the products.

Use Node.js 22.12.0 or newer. With nvm, run `nvm install` and `nvm use` from
the repository root to use the version in `.nvmrc`.

The root, backend, frontend, and dashboard each have their own dependency files.
Install each package using its lockfile:

```sh
npm ci
npm --prefix backend ci
npm --prefix frontend ci
npm --prefix dashboard ci
```

For local authentication testing, create the environment files if they do not
already exist. These commands preserve existing local settings:

```sh
cp -n backend/.env.example backend/.env
cp -n frontend/.env.example frontend/.env
```

Fill in the blank values in `backend/.env` before starting the server:

| Settings | Purpose |
| --- | --- |
| `MONGODB_URI` | A running development MongoDB database; the example defaults to a local instance. |
| `JWT_SECRET`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Three different random secrets. Generate each with `openssl rand -hex 32`. |
| `UPSTASH_REDIS_URL`, `UPSTASH_REDIS_TOKEN` | Upstash Redis REST credentials used to store login and refresh tokens. |
| `EMAIL_USER`, `EMAIL_PASS` | Gmail sender and [app password](https://support.google.com/accounts/answer/185833) for verification emails. |
| `GOOGLE_*`, `APPLE_*` | Social-login provider configuration. The current server initializes these strategies during startup, even for email/password testing. |
| `STRIPE_SECRET_KEY` | A Stripe test secret key. Payment clients are also initialized during startup. |

For the `Upstash Redis URL or Token is missing` error, open your database in the
[Upstash Console](https://console.upstash.com/) and copy its REST credentials.
Map Upstash's `UPSTASH_REDIS_REST_URL` value to this project's
`UPSTASH_REDIS_URL`, and its `UPSTASH_REDIS_REST_TOKEN` value to
`UPSTASH_REDIS_TOKEN`. The URL must be the HTTPS REST endpoint; use the
read/write token because authentication writes tokens to Redis.
See the [Upstash REST connection guide](https://upstash.com/docs/redis/features/restapi).
Removing the startup check would not make login work without Redis.

Keep credentials in the ignored `.env` files. Only the example files belong in
Git. Environment configuration alone does not verify Google or Apple login;
those flows need their own end-to-end checks. The existing Apple code includes
an unimplemented code-exchange path.

Start the backend and frontend in separate terminals from the repository root:

```sh
# Terminal 1
npm --prefix backend run dev
```

```sh
# Terminal 2
npm --prefix frontend run dev
```

Open `http://localhost:5173`, which matches the backend's current allowed origin.
Restart the corresponding server after editing an environment file. Wait for
both `Server listening on 3001` and `MongoDB connected successfully` in the
backend terminal. `http://localhost:3001/health` checks that HTTP is running;
it does not check MongoDB, Redis, email delivery, or authentication.

To review the Client dashboard while backend configuration is unavailable, run
`npm --prefix frontend run dev` and open
`http://localhost:5173/preview/client-dashboard`. This development-only page uses
clearly labeled sample orders and does not mount the authentication provider or
call the API. Use the Preview state menu to inspect populated, empty, loading, and error
states. Search, filters, sorting, order details, and a simulated receipt
confirmation work locally; Reset preview restores the sample orders. Other
account actions explain their destination without sending requests.

The preview route and sample data are excluded from production builds. The
normal `/client-dashboard` page still requires authentication and loads orders
from the existing API.

The Traveler dashboard is also available at
`http://localhost:5173/preview/traveler-dashboard`. Its sample deliveries support
search, destination/category/urgency/price filters, sorting, acceptance, shipping,
and handover. Use **Simulate client receipt** in the preview bar to unlock the
proof step. Selecting a file exercises validation, but the preview never uploads
or stores the file. **Reset preview** restores the sample deliveries. Empty,
loading, and error states are available in the Preview state menu.

The Traveler preview and fixtures are also excluded from production builds.
The authenticated `/traveler-dashboard` uses the existing API. Proof submission
checks the upload result before completing a delivery and offers a status-only
retry if the proof succeeds but the subsequent status update fails. Live
authentication, delivery persistence, and payments still require backend setup.

Preview **Create an order** at `http://localhost:5173/preview/new-order`, or use
Create an order from the Client dashboard preview. It includes sample, empty,
loading, error, failed-save, and edit states. Product photos are processed in
browser memory; the preview sends no API requests and creates no orders or
payments. Its route and sample data are excluded from production builds.

The real `/new-order` page requires authentication. It shows a quantity-aware
price summary with the existing 15% fee, preserves entered details after a
failed save, and opens the real cart for review. Editing loads full product
details; quantity, category, and photos remain fixed because the existing update
endpoint does not fully support changing them. Existing optional details may be
replaced but cannot be cleared. Saving never reports a successful payment.

Preview the refreshed cart at `http://localhost:5173/preview/cart`. The Client
dashboard and Create an order previews link to it. Sample items can be added,
edited, and removed across the form and cart previews using browser route state;
no API or payment request is sent. Reset preview restores the sample cart. Empty,
loading, loading-error, removal-error, and unavailable-item states are included.
The cart preview and fixtures are excluded from production builds.

The real cart uses the API's item totals, which already include the service fee.
Removal updates only the confirmed item and preserves the rest of the cart on
failure. Missing item IDs or prices prevent checkout until the cart is corrected.
The current API omits IDs for deleted products, so those entries can be refreshed
but cannot be removed through the frontend. Continue to checkout opens the
existing checkout page; payment processing still needs live backend verification.
The existing shared authentication interceptor also needs follow-up: if both the
session check and token-refresh endpoint return `401`, refresh can wait on itself
and leave authentication loading. This is separate from the cart refresh.

Preview checkout at `http://localhost:5173/preview/checkout`, or choose Continue
to checkout in the cart preview. Cart items carry across both pages. The preview
includes loading, empty, unavailable-item, request-error, and whole-shilling cart
states. Phone approval and hosted checkout are simulations: no API calls, orders,
payment requests, or provider redirects occur. Preview code stays out of builds.

The real `/checkout` reloads the authenticated cart, validates the selected
method and contact details, and prevents repeated submissions while a request is
running or has been initiated. M-Pesa and Airtel initiation show a pending state
with the returned order reference, never a payment-success receipt. Paystack uses
the returned HTTPS authorization URL. Direct card and PayPal options are marked
unavailable because the existing integration does not collect a payment-method
token; placeholder card fields, the hard-coded Stripe key, and the inactive
voucher control have been removed. Item changes are available through Edit cart.

Backend payment work remains necessary before live verification: the combined
endpoint marks orders Paid at initiation, creates an order before contacting the
provider, and has no idempotency protection. Its M-Pesa requests round up to whole
shillings (shown in the form); Paystack truncates fractional amounts (blocked in
checkout until fixed). Frontend checks do not replace server-side validation.

Run security audits separately:

```sh
npm audit
npm --prefix backend audit
npm --prefix frontend audit
npm --prefix dashboard audit
```

Validate dependency compatibility and production builds:

```sh
npm --prefix backend test
node --test frontend/test/client-dashboard.test.mjs
node --test frontend/test/traveler-dashboard.test.mjs
node --test frontend/test/new-order.test.mjs
node --test frontend/test/cart.test.mjs
node --test frontend/test/checkout.test.mjs
npm --prefix frontend run build
npm --prefix dashboard run build
```

The backend tests cover password-hash compatibility, offline email composition,
and upload parsing. They do not connect to databases or send email. Live service
checks require the appropriate backend environment configuration.
