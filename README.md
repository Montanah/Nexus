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
npm --prefix frontend run build
npm --prefix dashboard run build
```

The backend tests cover password-hash compatibility, offline email composition,
and upload parsing. They do not connect to databases or send email. Live service
checks require the appropriate backend environment configuration.
