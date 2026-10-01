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
