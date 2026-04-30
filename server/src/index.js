/* import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config.js';
import { migrate } from './db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { checkoutLimiter, apiLimiter, readLimiter } from './middleware/rateLimiter.js';
import { menuRouter } from './routes/menu.js';
import { availabilityRouter } from './routes/availability.js';
import { ordersRouter } from './routes/orders.js';
import { adminRouter } from './routes/admin.js';
import { webhooksRouter } from './routes/webhooks.js';

migrate();

const app = express();

app.use(helmet());
app.use(cors({ origin: config.clientOrigin }));
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

// The verify callback stores the raw request body for Clover webhook HMAC checks.
app.use(express.json({
  verify: (req, res, buffer) => {
    req.rawBody = buffer.toString('utf8');
  }
}));

app.get('/api/health', readLimiter, (req, res) => {
  res.json({ ok: true, environment: config.nodeEnv });
});

app.use('/api/menu', readLimiter, menuRouter);
app.use('/api/availability', readLimiter, availabilityRouter);
app.use('/api/orders/create-checkout', checkoutLimiter);
app.use('/api/orders', apiLimiter, ordersRouter);
app.use('/api/admin', apiLimiter, adminRouter);
app.use('/api/webhooks', webhooksRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Clover ordering API running on http://localhost:${config.port}`);
});
 */

import cors from "cors";

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://chic-liger-636b51.netlify.app",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allows curl/Postman/server-to-server requests with no browser origin
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-admin-api-key"],
    credentials: false
  })
);