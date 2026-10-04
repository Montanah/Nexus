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

Payment outcome previews are available at
`http://localhost:5173/preview/payment-success` and
`http://localhost:5173/preview/payment-failure`, also linked from the checkout
preview as Payment outcomes. They include confirmed, failed, pending, verifying,
verification-error, missing-detail, item-detail-error, and sign-in states.
These use synthetic references and make no API or payment requests; preview
routes and fixtures are excluded from production builds.

The real payment result routes and `/verify-paystack` use the authenticated
Paystack verification endpoint. They read the nested provider status, preserve
the callback reference in the URL for reloads, and show confirmation only for
`data.status: success`. A successful HTTP response or an order marked Paid is
not treated as payment confirmation. Amounts come from verification in minor
units; missing amounts and dates remain unavailable. Order details load
separately, and retrying item details never repeats payment verification.
Opening a result URL without a payment reference (including the unsupported
Stripe session link) shows an unconfirmed state. Navigation state alone cannot
create a receipt. Email-delivery and escrow claims have been removed because
this flow provides no evidence for them. Live provider callbacks and existing
backend payment/authentication limitations still need backend verification.

Preview order details at `http://localhost:5173/preview/order-details`. Choose
View full order in the Client dashboard preview or View order details after a
sample successful payment to carry that order into the page. Each item has its
own delivery progress, requested arrival, destination, traveler details, and
receipt-confirmation action. Returning through Your dashboard or Back to all
your orders retains sample confirmations. Reset preview restores the original
sample. The preview includes mixed, pending, completed, cancelled, confirmation
error, missing-product, empty, loading, refresh-error, and not-found states. No
API calls are made, and the route and sample data are excluded from production.

The authenticated `/orders/:orderNumber` page loads the selected order from the
API. It uses recorded totals and payment status; this page does not independently
verify payment. Requested arrival dates are not guaranteed delivery dates, and
an unpopulated traveler ID displays as Traveler assigned. Receipt confirmation
updates only the matching item after the API acknowledges its ID and status;
delivery remains active until the traveler finishes the delivery proof. Failed
refreshes preserve details but disable item actions until a successful reload.
Live persistence still requires backend setup. The existing single-order endpoint
also populates `travelerId`, which is absent from the Order schema; that backend
query and actual receipt/rating behavior need verification when backend work
resumes. The frontend exposes recoverable loading errors in the meantime.

Preview feedback at `http://localhost:5173/preview/rating` (a client rating a
traveler) or `http://localhost:5173/preview/rating?as=traveler` (a traveler rating
a client). Eligible rating links in the order details and both dashboard previews
open the selected item. Stars and an optional comment can be submitted locally;
returning to the order or dashboard retains the sample rating. The preview has
save-error, already-rated, unavailable-stage, missing-details, loading, and error
states. It makes no API requests and is excluded from production builds.

The real `/rate-product/:productId` page requires sign-in and reloads the item
from the account's orders or claimed deliveries. Links include `?as=client` or
`?as=traveler` so the intended rating direction survives opening a direct URL;
older navigation state and the account role are fallbacks. An unknown role shows
dashboard links instead of guessing an endpoint. The form starts without a
rating, supports keyboard star selection, limits comments to 500 characters,
retains input after failed saves, and prevents simultaneous submissions. A saved
state requires the API's success flag and a valid rating result. Existing ratings
and duplicate-rating responses prevent another submission.

Backend rating limitations remain deferred: clients can currently rate only at
Client Confirmed or Delivered, while travelers can rate only at Complete. Claimed
products do not include the order item's client rating, so an existing traveler
review may be detected only when the API rejects a duplicate submission. Both
rating endpoints save the order item before updating the recipient's aggregate
rating, without a transaction; failures can leave a partially saved rating.
Actual persistence and aggregate updates still need live backend verification.

Preview account settings at `http://localhost:5173/preview/settings` or
`http://localhost:5173/preview/settings?as=traveler`. Settings links from both
dashboards, order details, the order form, cart, and checkout previews open this
page. Profile edits are simulated locally; returning to the dashboard carries
the saved sample name and the existing order/delivery data. Reset preview restores
the starting account. Loading, save-error, sign-out-error, unverified email,
missing details, and unavailable-photo states are included. Preview code and
fixtures are excluded from production builds.

The real `/settings` waits for authentication, loads the signed-in user's profile,
and saves only changed `name` and `phone_number` fields through the shared API
service. A success message requires an acknowledged response for the same user
with the submitted values. Failed saves preserve edits; successful saves update
the shared account context so other pages display the new name. Empty phone
replacements are blocked because the current backend ignores them. International
phone formatting is preserved. Email is read-only, and existing photos display
with an initials fallback. The workspace query is a navigation hint, not an
account-role update. Sign-out failures retain the profile form.

Security backend work remains deferred. Authenticator setup is marked unavailable:
the existing enable endpoint is unauthenticated, immediately replaces/enables a
secret, and the active email-code login flow does not enforce authenticator codes.
Profile responses also omit the authenticator status. Password changes are marked
unavailable because the reset endpoint currently neither verifies the submitted
code nor updates the password. Settings does not call these endpoints or claim
security changes succeeded. The profile update endpoint still needs server-side
ownership enforcement and an email-change verification flow before wider rollout;
this UI targets only the authenticated user and excludes email from its payload.
Live profile persistence and sign-out require the backend setup.

Preview the password recovery flow at
`http://localhost:5173/preview/password-recovery`. It shares the login/signup
design and includes email entry, an email-code confirmation, a new-password form,
and a clearly labeled preview completion. Use sample details and the six-digit
code shown in the preview bar. Send, resend, reset-error, and expired-code states
support retries. Passwords have independent visibility controls and matching-field
validation. Resending starts a 30-second local cooldown; simulated codes expire
after 10 minutes. Changing email, restarting, completing, or leaving the preview
clears password fields. Nothing is sent to an API or stored in browser storage or
URLs. Preview controls and sample credentials are excluded from production builds.

The real `/forgot-password`, `/email-sent`, and `/reset-password` pages show a
styled unavailable state with a login link. They are public routes that work
without loading the authentication provider or contacting the backend. Direct
URLs and old token links cannot display a false email-sent or password-reset
success. The old live forms have been disabled because the backend reset endpoint
does not verify the code or change the password, uses the wrong expiry field,
and its request contract differs from the existing frontend service. Backend
recovery work remains deferred; verify code expiry, single-use behavior, password
persistence, and email delivery before connecting the new UI to live actions.

Preview the traveler’s full delivery page at
`http://localhost:5173/preview/delivery-details`. The Traveler dashboard’s
“Open full details” button opens the selected item. Try accepting, shipping,
handover, simulated client receipt, delivery proof, and rating. The preview
includes action failures, a saved-proof/status-update failure, missing details,
unavailable photos, loading, and unavailable-delivery states. Returning to the
dashboard carries the updated sample delivery and selects the appropriate tab.
Selected proof files are validated but never read, uploaded, or stored in this
preview. Its route, controls, and fixtures are excluded from production builds.

The real `/product-details/:productId` now reads the route ID, waits for sign-in,
and resolves the item from available paid listings or the signed-in traveler’s
claimed products. It does not infer ownership by comparing a traveler profile ID
to a user ID. Unavailable items and failed loads provide retry/navigation options.
The full page shows product photos, item facts, destination, requested arrival,
the traveler reward, delivery progress, and stage-appropriate actions. Accepting
initializes a traveler profile through the existing earnings endpoint if needed.
Claim and status responses must acknowledge the same product and expected stage.
The shared proof service now also requires the matching product and saved proof;
generic HTTP success cannot trigger completion. If proof succeeds but status
synchronization fails, “Finish delivery” retries only the status update. That
acknowledgement survives an in-page refresh, but not a full browser reload.

Backend delivery work remains deferred: the proof endpoint does not enforce
ownership, and claim/status/proof writes are not transactional. The frontend only
exposes owned-delivery actions, but this does not replace server-side checks.
The claimed-products API does not return saved order-item proof or client ratings;
partial saves and duplicate ratings still need reconciliation on the backend.
JSON proof requests also pass through the server’s default 100 KB body limit,
despite the proof validator accepting files up to 5 MB; larger uploads can fail
until that backend limit is reconciled. Preview validation does not test transport.
Actual delivery persistence, uploaded-proof storage, and earnings need live
backend verification.

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
node --test frontend/test/payment-result.test.mjs
node --test frontend/test/order-details.test.mjs
node --test frontend/test/rating.test.mjs
node --test frontend/test/settings.test.mjs
node --test frontend/test/password-recovery.test.mjs
node --test frontend/test/delivery-details.test.mjs
npm --prefix frontend run build
npm --prefix dashboard run build
```

The backend tests cover password-hash compatibility, offline email composition,
and upload parsing. They do not connect to databases or send email. Live service
checks require the appropriate backend environment configuration.
