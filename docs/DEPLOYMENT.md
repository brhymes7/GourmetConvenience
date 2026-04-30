# Deployment Guide

## Best deployment style

Because this starter uses SQLite, deploy it somewhere with persistent disk.

Good choices:

- Render Web Service with persistent disk
- Railway with persistent storage
- VPS with Node.js, PM2, and Nginx

Bad fit unless modified:

- Netlify Functions
- Vercel Serverless Functions

Those platforms do not give you reliable persistent local disk for SQLite. Use Postgres if you want serverless.

## Environment variables

Set these in your host:

```env
NODE_ENV=production
PORT=5001
APP_BASE_URL=https://your-frontend-domain.com
CLIENT_ORIGIN=https://your-frontend-domain.com
ADMIN_API_KEY=long-random-secret
CLOVER_ENV=production
CLOVER_MERCHANT_ID=live_merchant_id
CLOVER_PRIVATE_TOKEN=live_private_token
CLOVER_PAGE_CONFIG_UUID=optional
CLOVER_WEBHOOK_SIGNING_SECRET=live_webhook_secret
DEFAULT_TAX_RATE_BPS=0
```

## Build frontend

From project root:

```bash
npm run build
```

The frontend build output goes to:

```txt
client/dist
```

## Production command

If deploying only the backend API:

```bash
npm start --prefix server
```

If using a VPS, you can run it with PM2:

```bash
pm2 start server/src/index.js --name clover-ordering-api
pm2 save
```

## Reverse proxy example with Nginx

```nginx
server {
  server_name api.yourdomain.com;

  location / {
    proxy_pass http://localhost:5001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## Production checklist

- [ ] Clover sandbox checkout works.
- [ ] Clover sandbox webhook marks order paid.
- [ ] Production tokens are added only to server environment variables.
- [ ] HTTPS works.
- [ ] Clover webhook URL is production URL.
- [ ] Webhook signing secret is configured.
- [ ] SQLite file is on persistent disk.
- [ ] Backups are configured.
- [ ] Admin API key is strong.
- [ ] Rate limiting is added.
- [ ] Tax behavior is confirmed with the merchant/accountant.
