# Cloudflare Workers Deployment

This app is configured to deploy to `melody.438d.xyz` using Cloudflare Workers.

## Prerequisites

1. Ensure `438d.xyz` is managed by Cloudflare
2. Have Cloudflare account credentials ready

## Setup

1. Install dependencies:
```bash
npm install
```

2. Authenticate with Cloudflare:
```bash
npx wrangler login
```

## Deployment

### Full Deployment

Build and deploy to production:
```bash
npm run deploy
```

This will:
1. Build the Vite app to the `dist` folder
2. Deploy to Cloudflare Workers
3. Automatically configure DNS and SSL for `melody.438d.xyz`

### Dry Run

Test the deployment without actually deploying:
```bash
npm run deploy:dry-run
```

## Configuration

The deployment is configured in `wrangler.toml`:
- **Worker name**: `melody-dawn`
- **Custom domain**: `melody.438d.xyz`
- **Static assets**: Served from `./dist` folder
- **Worker script**: `worker/index.js` handles routing and serves the SPA

## Features

- ✅ Single Page Application (SPA) routing support
- ✅ Client-side routing fallback to `index.html`
- ✅ Optimized caching headers for assets
- ✅ Security headers (X-Frame-Options, CSP, etc.)
- ✅ Automatic SSL/TLS certificate management
- ✅ Custom domain configuration

## Notes

- The worker script serves all requests, handling both static assets and SPA routing
- Asset files (in `/assets/*`) are cached for 1 year
- The main `index.html` is not cached to ensure fresh content
- All routes without file extensions are served `index.html` for client-side routing

