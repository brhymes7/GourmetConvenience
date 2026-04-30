import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'data', 'orders.sqlite');

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

/**
 * SQLite is perfect for a starter project because it has no monthly bill.
 * Production note: make sure the server has persistent disk storage, or upgrade
 * to Postgres when order volume grows.
 */
export function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT,
      pickup_time_iso TEXT NOT NULL,
      order_comment TEXT,
      subtotal_cents INTEGER NOT NULL,
      tax_cents INTEGER NOT NULL DEFAULT 0,
      total_cents INTEGER NOT NULL,
      checkout_session_id TEXT,
      checkout_url TEXT,
      clover_payment_id TEXT,
      clover_webhook_status TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      menu_item_id TEXT NOT NULL,
      name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price_cents INTEGER NOT NULL,
      note TEXT,
      FOREIGN KEY(order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS order_events (
      id TEXT PRIMARY KEY,
      order_id TEXT,
      event_type TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(order_id) REFERENCES orders(id)
    );

    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_checkout_session ON orders(checkout_session_id);
    CREATE INDEX IF NOT EXISTS idx_orders_pickup_time ON orders(pickup_time_iso);
  `);

  const orderColumns = db.prepare('PRAGMA table_info(orders)').all().map((column) => column.name);
  if (!orderColumns.includes('order_comment')) {
    db.exec('ALTER TABLE orders ADD COLUMN order_comment TEXT');
  }
}

export function createOrder({ customer, pickupTimeIso, orderComment, items, subtotalCents, taxCents, totalCents }) {
  const now = new Date().toISOString();
  const orderId = randomUUID();

  const insertOrder = db.prepare(`
    INSERT INTO orders (
      id, status, customer_name, customer_email, customer_phone,
      pickup_time_iso, order_comment, subtotal_cents, tax_cents, total_cents,
      created_at, updated_at
    ) VALUES (
      @id, @status, @customer_name, @customer_email, @customer_phone,
      @pickup_time_iso, @order_comment, @subtotal_cents, @tax_cents, @total_cents,
      @created_at, @updated_at
    )
  `);

  const insertItem = db.prepare(`
    INSERT INTO order_items (
      id, order_id, menu_item_id, name, quantity, price_cents, note
    ) VALUES (
      @id, @order_id, @menu_item_id, @name, @quantity, @price_cents, @note
    )
  `);

  const tx = db.transaction(() => {
    insertOrder.run({
      id: orderId,
      status: 'pending_checkout',
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone || null,
      pickup_time_iso: pickupTimeIso,
      order_comment: orderComment || null,
      subtotal_cents: subtotalCents,
      tax_cents: taxCents,
      total_cents: totalCents,
      created_at: now,
      updated_at: now
    });

    for (const item of items) {
      insertItem.run({
        id: randomUUID(),
        order_id: orderId,
        menu_item_id: item.menuItemId,
        name: item.name,
        quantity: item.quantity,
        price_cents: item.priceCents,
        note: item.note || null
      });
    }
  });

  tx();
  return getOrderById(orderId);
}

export function attachCheckoutSession(orderId, { checkoutSessionId, checkoutUrl }) {
  db.prepare(`
    UPDATE orders
    SET checkout_session_id = ?, checkout_url = ?, updated_at = ?
    WHERE id = ?
  `).run(checkoutSessionId, checkoutUrl, new Date().toISOString(), orderId);

  return getOrderById(orderId);
}

export function updateOrderStatus(orderId, status, extra = {}) {
  db.prepare(`
    UPDATE orders
    SET status = ?,
        clover_payment_id = COALESCE(?, clover_payment_id),
        clover_webhook_status = COALESCE(?, clover_webhook_status),
        updated_at = ?
    WHERE id = ?
  `).run(
    status,
    extra.cloverPaymentId || null,
    extra.cloverWebhookStatus || null,
    new Date().toISOString(),
    orderId
  );

  return getOrderById(orderId);
}

export function getOrderById(orderId) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return null;

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
  return { ...order, items };
}

export function getOrderByCheckoutSessionId(checkoutSessionId) {
  const order = db.prepare('SELECT * FROM orders WHERE checkout_session_id = ?').get(checkoutSessionId);
  return order ? getOrderById(order.id) : null;
}

export function listRecentOrders(limit = 50) {
  const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT ?').all(limit);
  return orders.map((order) => ({
    ...order,
    items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id)
  }));
}

export function createOrderEvent({ orderId, eventType, payload }) {
  db.prepare(`
    INSERT INTO order_events (id, order_id, event_type, payload_json, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    randomUUID(),
    orderId || null,
    eventType,
    JSON.stringify(payload),
    new Date().toISOString()
  );
}
