import React from 'react';
import { createRoot } from 'react-dom/client';
import { ShoppingBag, Clock, ShieldCheck, ChevronRight } from 'lucide-react';
import {
  createCheckout,
  fetchAdminMenu,
  fetchAdminOrders,
  fetchAdminSettings,
  fetchAvailability,
  fetchMenu,
  saveAdminMenu,
  saveAdminSettings
} from './api.js';
import './styles.css';

function money(cents) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function todayIsoDate() {
  // Use ET so the date matches the server's America/New_York zone.
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
}

function storeStatus(slots) {
  if (slots.length === 0) return { open: false, label: 'Closed for today' };
  const next = slots[0];
  return { open: true, label: `Next available: ${next.label}` };
}

const STORE_HOURS = [
  'Mon – Fri: 7:00 AM – 10:00 PM',
  'Saturday: 9:00 AM – 11:00 PM',
  'Sunday: 9:00 AM – 10:00 PM',
];

const CHEESE_OPTIONS = ['American', 'Provolone', 'Pepper Jack'];
const MEAT_OPTIONS = ['Roast Beef', 'Turkey Ham', 'Turkey', 'Beef Salami', 'Beef Pepperoni', 'Buffalo Chicken'];
const TOPPING_OPTIONS = ['Lettuce', 'Tomatoes', 'Onions', 'Banana Peppers'];
const SAUCE_OPTIONS = ['Mayo', 'Ketchup', 'Mustard', 'Chipotle Southwest', 'Honey Mustard'];
const ADDON_OPTIONS = [
  { id: 'extra-meat',   label: 'Extra Meat',      priceCents: 199 },
  { id: 'hot-honey',    label: 'Hot Honey',        priceCents: 99  },
  { id: 'add-bacon',    label: 'Add Bacon',        priceCents: 199 },
  { id: 'make-combo',   label: 'Make It a Combo',  priceCents: 199 },
];

const BASE_IDS = ['footlong-sub', '6inch-sub', '6inch-ciabatta', 'bagel'];

function buildNote({ cheese, meat, toppings, sauces, addons }) {
  const parts = [];
  if (cheese) parts.push(`Cheese: ${cheese}`);
  if (meat) parts.push(`Meat: ${meat}`);
  if (toppings.length) parts.push(`Toppings: ${toppings.join(', ')}`);
  if (sauces.length) parts.push(`Sauces: ${sauces.join(', ')}`);
  return parts.join(' | ');
}

const STEPS = [
  { id: 'cheese',   label: 'Cheese',          hint: 'Pick one' },
  { id: 'meat',     label: 'Meat',            hint: 'Pick one' },
  { id: 'toppings', label: 'Toppings',        hint: 'Pick any' },
  { id: 'sauces',   label: 'Sauces',          hint: 'Pick any' },
  { id: 'upgrades', label: 'Upgrade',         hint: 'Optional add-ons' },
];

function CustomizerModal({ item, onConfirm, onClose }) {
  const isBase = BASE_IDS.includes(item.id);
  const [step, setStep] = React.useState(0);
  const [cheese, setCheese] = React.useState('');
  const [meat, setMeat] = React.useState('');
  const [toppings, setToppings] = React.useState([]);
  const [sauces, setSauces] = React.useState([]);
  const [addons, setAddons] = React.useState([]);

  const totalSteps = isBase ? STEPS.length : 0;

  function toggleMulti(list, setList, value) {
    setList((prev) => prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]);
  }

  function toggleAddon(addon) {
    setAddons((prev) =>
      prev.find((a) => a.id === addon.id)
        ? prev.filter((a) => a.id !== addon.id)
        : [...prev, addon]
    );
  }

  // Auto-advance after single-select picks (cheese, meat)
  function pickSingle(setter, current, value, nextStep) {
    setter(current === value ? '' : value);
    if (current !== value) {
      setTimeout(() => setStep(nextStep), 420);
    }
  }

  const addonTotal = addons.reduce((sum, a) => sum + a.priceCents, 0);
  const totalCents = item.priceCents + addonTotal;
  const isLastStep = step === totalSteps - 1;

  // Build a readable summary of selections so far
  const summary = [
    cheese && `🧀 ${cheese}`,
    meat && `🥩 ${meat}`,
    toppings.length && `🥬 ${toppings.join(', ')}`,
    sauces.length && `🫙 ${sauces.join(', ')}`,
    addons.length && `⭐ ${addons.map((a) => a.label).join(', ')}`,
  ].filter(Boolean);

  function handleConfirm() {
    const note = isBase ? buildNote({ cheese, meat, toppings, sauces, addons }) : '';
    onConfirm(item, note, addonTotal, addons.map((addon) => addon.id));
  }

  function renderStepContent() {
    const s = STEPS[step];
    if (s.id === 'cheese') return (
      <div className="chip-group" role="group" aria-label="Choose your cheese">
        {CHEESE_OPTIONS.map((c) => {
          const selected = cheese === c;
          return (
            <button
              key={c} type="button"
              className={`chip ${selected ? 'active' : ''}`}
              aria-pressed={selected}
              onClick={() => pickSingle(setCheese, cheese, c, 1)}
            >
              {selected && <span className="chip-check" aria-hidden="true">✓</span>}
              {c}
            </button>
          );
        })}
      </div>
    );
    if (s.id === 'meat') return (
      <div className="chip-group" role="group" aria-label="Choose your meat">
        {MEAT_OPTIONS.map((m) => {
          const selected = meat === m;
          return (
            <button
              key={m} type="button"
              className={`chip ${selected ? 'active' : ''}`}
              aria-pressed={selected}
              onClick={() => pickSingle(setMeat, meat, m, 2)}
            >
              {selected && <span className="chip-check" aria-hidden="true">✓</span>}
              {m}
            </button>
          );
        })}
      </div>
    );
    if (s.id === 'toppings') return (
      <div className="chip-group" role="group" aria-label="Choose your toppings">
        {TOPPING_OPTIONS.map((t) => {
          const selected = toppings.includes(t);
          return (
            <button
              key={t} type="button"
              className={`chip ${selected ? 'active' : ''}`}
              aria-pressed={selected}
              onClick={() => toggleMulti(toppings, setToppings, t)}
            >
              {selected && <span className="chip-check" aria-hidden="true">✓</span>}
              {t}
            </button>
          );
        })}
      </div>
    );
    if (s.id === 'sauces') return (
      <div className="chip-group" role="group" aria-label="Choose your sauces">
        {SAUCE_OPTIONS.map((s) => {
          const selected = sauces.includes(s);
          return (
            <button
              key={s} type="button"
              className={`chip ${selected ? 'active' : ''}`}
              aria-pressed={selected}
              onClick={() => toggleMulti(sauces, setSauces, s)}
            >
              {selected && <span className="chip-check" aria-hidden="true">✓</span>}
              {s}
            </button>
          );
        })}
      </div>
    );
    if (s.id === 'upgrades') return (
      <div className="addon-chips" role="group" aria-label="Optional upgrades">
        {ADDON_OPTIONS.map((a) => {
          const active = !!addons.find((x) => x.id === a.id);
          return (
            <button
              key={a.id} type="button"
              className={`addon-chip ${active ? 'active' : ''}`}
              aria-pressed={active}
              onClick={() => toggleAddon(a)}
            >
              <span className="addon-chip-left">
                {active && <span className="chip-check" aria-hidden="true">✓</span>}
                {a.label}
              </span>
              <span className="addon-chip-price">+{money(a.priceCents)}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={`Customize ${item.name}`}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>

        {/* Image header */}
        <div className="modal-img-wrap">
          <img src={item.image} alt={item.name} />
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close customizer">✕</button>
          <div className="modal-img-info">
            <span className="modal-item-name">{item.name}</span>
            <span className="modal-live-price" aria-live="polite" aria-label={`Total: ${money(totalCents)}`}>{money(totalCents)}</span>
          </div>
        </div>

        {isBase ? (
          <div className="modal-body">
            {/* Progress bar */}
            <div className="step-progress" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={totalSteps}>
              {STEPS.map((s, i) => (
                <div key={s.id} className={`step-dot ${i < step ? 'done' : i === step ? 'active' : ''}`} />
              ))}
            </div>

            {/* Step header */}
            <div className="step-header">
              <span className="step-counter">Step {step + 1} of {totalSteps}</span>
              <h3>{STEPS[step].label}</h3>
              <p className="step-hint">{STEPS[step].hint}</p>
            </div>

            {/* Step content */}
            <div className="step-content">
              {renderStepContent()}
            </div>

            {/* Live selections summary */}
            {summary.length > 0 && (
              <div className="selections-summary" aria-live="polite">
                <p className="selections-label">Your order so far</p>
                <div className="selections-list">
                  {summary.map((s) => <span key={s} className="selection-tag">{s}</span>)}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="step-nav">
              {step > 0 && (
                <button type="button" className="step-back" onClick={() => setStep(step - 1)} aria-label="Go to previous step">← Back</button>
              )}
              {!isLastStep ? (
                <button type="button" className="step-next" onClick={() => setStep(step + 1)} aria-label="Go to next step">Next →</button>
              ) : (
                <button type="button" className="step-confirm" onClick={handleConfirm} aria-label={`Add ${item.name} to order for ${money(totalCents)}`}>
                  Add to order — {money(totalCents)}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="modal-body">
            <h3>{item.name}</h3>
            <p className="step-hint" style={{ marginBottom: 20 }}>{item.description}</p>
            <button type="button" className="step-confirm" onClick={handleConfirm} aria-label={`Add ${item.name} to order for ${money(totalCents)}`}>
              Add to order — {money(totalCents)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusPage({ type }) {
  const isSuccess = type === 'success';
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session_id');
  const errorCode = params.get('error_code');

  return (
    <main className="status-page">
      <div className="status-card">
        <img src="/logo.png" alt="Gourmet Convenience" className="status-logo" />
        <p className="eyebrow">{isSuccess ? 'Payment submitted' : 'Payment not completed'}</p>
        <h1>{isSuccess ? 'Thanks, your order is being confirmed.' : 'Checkout was not completed.'}</h1>
        <p className="status-copy">
          {isSuccess
            ? 'Clover is processing the payment result. The store will prepare your pickup order once the payment webhook confirms it.'
            : 'No completed payment was recorded from this checkout attempt. You can return to the menu and try again.'}
        </p>
        {sessionId && <p className="status-meta">Checkout session: {sessionId}</p>}
        {errorCode && <p className="status-meta">Clover error: {errorCode}</p>}
        <a href="/" className="button primary">Back to menu</a>
      </div>
    </main>
  );
}

function AdminPage() {
  const [apiKey, setApiKey] = React.useState(() => window.localStorage.getItem('adminApiKey') || '');
  const [orders, setOrders] = React.useState([]);
  const [settingsText, setSettingsText] = React.useState('');
  const [menuText, setMenuText] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  async function loadAdminData(key = apiKey) {
    setLoading(true);
    setMessage('');
    try {
      const [ordersData, settingsData, menuData] = await Promise.all([
        fetchAdminOrders(key),
        fetchAdminSettings(key),
        fetchAdminMenu(key)
      ]);
      setOrders(ordersData.orders || []);
      setSettingsText(JSON.stringify(settingsData.settings, null, 2));
      setMenuText(JSON.stringify(menuData.menu, null, 2));
      window.localStorage.setItem('adminApiKey', key);
      setMessage('Admin data loaded.');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    setLoading(true);
    setMessage('');
    try {
      const parsed = JSON.parse(settingsText);
      const data = await saveAdminSettings(apiKey, parsed);
      setSettingsText(JSON.stringify(data.settings, null, 2));
      setMessage('Settings saved.');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveMenu() {
    setLoading(true);
    setMessage('');
    try {
      const parsed = JSON.parse(menuText);
      const data = await saveAdminMenu(apiKey, parsed);
      setMenuText(JSON.stringify(data.menu, null, 2));
      setMessage('Menu saved.');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Store Operations</h1>
        </div>
        <a href="/" className="button secondary">Storefront</a>
      </header>

      <section className="admin-login">
        <label htmlFor="admin-key">Admin API key
          <input
            id="admin-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="x-admin-api-key"
          />
        </label>
        <button className="button primary" type="button" onClick={() => loadAdminData()} disabled={loading || !apiKey}>
          {loading ? 'Loading...' : 'Load admin data'}
        </button>
      </section>
      {message && <p className="message admin-message">{message}</p>}

      <section className="admin-grid">
        <div className="admin-panel">
          <div className="admin-panel-head">
            <h2>Recent Orders</h2>
            <button type="button" onClick={() => loadAdminData()} disabled={loading || !apiKey}>Refresh</button>
          </div>
          <div className="admin-orders">
            {orders.length === 0 ? (
              <p className="admin-empty">No orders loaded.</p>
            ) : orders.map((order) => (
              <article className="admin-order" key={order.id}>
                <div>
                  <strong>{order.customer_name}</strong>
                  <span>{order.status} · {money(order.total_cents)}</span>
                </div>
                <p>{new Date(order.pickup_time_iso).toLocaleString()}</p>
                {order.order_comment && <p>{order.order_comment}</p>}
                <ul>
                  {order.items.map((item) => (
                    <li key={item.id}>{item.quantity}x {item.name}{item.note ? ` - ${item.note}` : ''}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-head">
            <h2>Business Hours</h2>
            <button type="button" onClick={saveSettings} disabled={loading || !apiKey || !settingsText}>Save</button>
          </div>
          <textarea className="admin-json" value={settingsText} onChange={(e) => setSettingsText(e.target.value)} spellCheck="false" />
        </div>

        <div className="admin-panel wide">
          <div className="admin-panel-head">
            <h2>Menu</h2>
            <button type="button" onClick={saveMenu} disabled={loading || !apiKey || !menuText}>Save</button>
          </div>
          <textarea className="admin-json menu-json" value={menuText} onChange={(e) => setMenuText(e.target.value)} spellCheck="false" />
        </div>
      </section>
    </main>
  );
}

function App() {
  const path = window.location.pathname;
  if (path === '/order/success') return <StatusPage type="success" />;
  if (path === '/order/failure') return <StatusPage type="failure" />;
  if (path === '/admin') return <AdminPage />;

  const today = todayIsoDate();
  const [menu, setMenu] = React.useState([]);
  const [cart, setCart] = React.useState([]);
  const [slots, setSlots] = React.useState([]);
  const [pickupTimeIso, setPickupTimeIso] = React.useState('');
  const [customer, setCustomer] = React.useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [orderComment, setOrderComment] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [customizing, setCustomizing] = React.useState(null);

  React.useEffect(() => {
    fetchMenu().then((data) => setMenu(data.menu)).catch((err) => setMessage(err.message));
  }, []);

  React.useEffect(() => {
    fetchAvailability(today).then((data) => {
      setSlots(data.slots || []);
      setPickupTimeIso(data.slots?.[0]?.value || '');
      setMessage(data.reason || '');
    }).catch((err) => setMessage(err.message));

    // Refresh slots every 60s so the list stays current as time passes
    const timer = setInterval(() => {
      fetchAvailability(today).then((data) => {
        setSlots(data.slots || []);
        setPickupTimeIso((prev) => {
          const stillValid = data.slots?.some((s) => s.value === prev);
          return stillValid ? prev : (data.slots?.[0]?.value || '');
        });
      }).catch(() => {});
    }, 60000);

    return () => clearInterval(timer);
  }, [today]);

  function openCustomizer(item) {
    if (BASE_IDS.includes(item.id)) {
      setCustomizing(item);
    } else {
      addToCart(item, '', 0);
    }
  }

  function addToCart(item, note, addonTotal, addonIds = []) {
    const cartKey = `${item.id}__${note}__${addonIds.join(',')}`;
    const totalPriceCents = item.priceCents + addonTotal;
    setCart((current) => {
      const existing = current.find((ci) => ci.cartKey === cartKey);
      if (existing) {
        return current.map((ci) => ci.cartKey === cartKey ? { ...ci, quantity: ci.quantity + 1 } : ci);
      }
      const addonLabels = ADDON_OPTIONS.filter((addon) => addonIds.includes(addon.id)).map((addon) => addon.label);
      const displayNote = [note, addonLabels.length && `Upgrades: ${addonLabels.join(', ')}`].filter(Boolean).join(' | ');
      return [...current, { cartKey, menuItemId: item.id, name: item.name, priceCents: totalPriceCents, quantity: 1, note, displayNote, addonIds }];
    });
    setCustomizing(null);
  }

  function updateCartItem(cartKey, updates) {
    setCart((current) =>
      current.map((ci) => ci.cartKey === cartKey ? { ...ci, ...updates } : ci).filter((ci) => ci.quantity > 0)
    );
  }

  const subtotal = cart.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);

  async function handleCheckout(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const result = await createCheckout({
        customer,
        pickupTimeIso,
        orderComment,
        items: cart.map(({ menuItemId, quantity, note, addonIds }) => ({ menuItemId, quantity, note, addonIds }))
      });
      window.location.href = result.checkoutUrl;
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  const [cartOpen, setCartOpen] = React.useState(false);
  const status = storeStatus(slots);
  const bases = menu.filter((i) => i.category === 'Build Your Own');
  const extras = menu.filter((i) => i.category === 'Extras');
  const convenience = menu.filter((i) => i.category === 'Convenience');

  return (
    <main>
      {customizing && (
        <CustomizerModal
          item={customizing}
          onConfirm={addToCart}
          onClose={() => setCustomizing(null)}
        />
      )}

      <section className="hero">
        <div className="hero-bg">
          <img
            className="hero-img"
            src="https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=1800&q=80"
            alt=""
          />
          <div className="hero-overlay" />
        </div>

        <nav className="nav">
          <div className="brand-lockup">
            <img src="/logo.png" alt="Gourmet Convenience" className="brand-logo" />
            <div className="brand-text">
              <span className="brand-gourmet">GOURMET</span>
              <span className="brand-convenience">CONVENIENCE</span>
            </div>
          </div>
          <a href="#order" className="nav-link">Order now</a>
        </nav>

        <div className="hero-body">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              {status.open ? 'Open now · Pickup today' : 'Closed today'}
            </div>
            <h1>
              Fresh deli,<br />
              <span className="text-gold">made your way.</span>
            </h1>
            <p className="hero-copy">
              Build your perfect sub, bagel, or ciabatta — your choice of meat, cheese, toppings, and sauce. Ready for pickup in minutes.
            </p>
            <div className="hero-actions">
              <a href="#order" className="button primary">Start your order</a>
              <a href="#convenience" className="button secondary">View menu</a>
            </div>
            <div className="hero-trust">
              <span><ShieldCheck size={14} /> Secure Clover checkout</span>
              <span><Clock size={14} /> {status.label}</span>
              <span><ShoppingBag size={14} /> Pickup only</span>
            </div>
          </div>

          <div className="hero-image-card">
            <img
              src="https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=900&q=80"
              alt="Fresh deli sub"
            />
            <div className="hero-image-badge">
              <strong>Fresh Made</strong>
              <span>to order daily</span>
            </div>
          </div>
        </div>
      </section>

      <section id="order" className="section order-layout">
        <div>

          {/* ── Build Your Own ── */}
          <div className="menu-section-header">
            <p className="eyebrow">Build Your Own</p>
            <h2>Choose Your Base</h2>
            <p className="section-desc">Pick your bread or bagel, then customize every detail inside the builder.</p>
          </div>
          <div className="menu-grid">
            {bases.map((item) => (
              <article className="menu-card" key={item.id} onClick={() => openCustomizer(item)}>
                <div className="menu-card-img-wrap">
                  <img src={item.image} alt={item.name} />
                  <span className="menu-card-price">{money(item.priceCents)}</span>
                  <span className="menu-card-tag">Customize</span>
                </div>
                <div className="menu-body">
                  <div className="menu-body-top">
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                  </div>
                  <button type="button" className="menu-cta">
                    Build it <ChevronRight size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* ── Extras ── */}
          <div className="menu-section-header" style={{ marginTop: '56px' }}>
            <p className="eyebrow">Extras</p>
            <h2>Ready-Made Items</h2>
            <p className="section-desc">Grab-and-go items ready for pickup alongside your order.</p>
          </div>
          <div className="menu-grid">
            {extras.map((item) => (
              <article className="menu-card" key={item.id} onClick={() => openCustomizer(item)}>
                <div className="menu-card-img-wrap">
                  <img src={item.image} alt={item.name} />
                  <span className="menu-card-price">{money(item.priceCents)}</span>
                </div>
                <div className="menu-body">
                  <div className="menu-body-top">
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                  </div>
                  <button type="button" className="menu-cta">
                    Add to order
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* ── Convenience ── */}
          <div id="convenience" className="menu-section-header" style={{ marginTop: '56px' }}>
            <p className="eyebrow">Convenience Items</p>
            <h2>Everything You Need</h2>
            <p className="section-desc">In-store convenience selection available for pickup alongside your deli order.</p>
          </div>
          <div className="menu-grid">
            {convenience.map((item) => (
              <article className="menu-card" key={item.id} onClick={() => openCustomizer(item)}>
                <div className="menu-card-img-wrap">
                  <img src={item.image} alt={item.name} />
                  <span className="menu-card-price">{money(item.priceCents)}</span>
                </div>
                <div className="menu-body">
                  <div className="menu-body-top">
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                  </div>
                  <button type="button" className="menu-cta">
                    Add to order
                  </button>
                </div>
              </article>
            ))}
          </div>

        </div>

        <aside className="checkout-panel">
          {/* Panel header */}
          <div className="panel-header">
            <div className="panel-title">
              <ShoppingBag size={18} />
              <span>Your Order</span>
            </div>
            {cart.length > 0 && (
              <span className="panel-count">{cart.reduce((s, i) => s + i.quantity, 0)} item{cart.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''}</span>
            )}
          </div>

          <form onSubmit={handleCheckout}>
            {/* Cart items */}
            {cart.length === 0 ? (
              <div className="cart-empty">
                <ShoppingBag size={32} strokeWidth={1.2} />
                <p>Your cart is empty</p>
                <span>Add items from the menu to get started</span>
              </div>
            ) : (
              <div className="cart-list">
                {cart.map((item) => (
                  <div className="cart-item" key={item.cartKey}>
                    <div className="cart-item-info">
                      <strong>{item.name}</strong>
                      {item.displayNote && <p className="cart-note">{item.displayNote}</p>}
                    </div>
                    <div className="cart-item-controls">
                      <div className="quantity-controls">
                        <button type="button" onClick={() => updateCartItem(item.cartKey, { quantity: item.quantity - 1 })}>−</button>
                        <span>{item.quantity}</span>
                        <button type="button" onClick={() => updateCartItem(item.cartKey, { quantity: item.quantity + 1 })}>+</button>
                      </div>
                      <span className="cart-item-price">{money(item.priceCents * item.quantity)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Divider */}
            <div className="panel-divider" />

            {/* Customer info */}
            <p className="panel-section-label">Your details</p>
            <div className="field-grid">
              <label htmlFor="firstName">First name<input id="firstName" required autoComplete="given-name" value={customer.firstName} onChange={(e) => setCustomer({ ...customer, firstName: e.target.value })} /></label>
              <label htmlFor="lastName">Last name<input id="lastName" required autoComplete="family-name" value={customer.lastName} onChange={(e) => setCustomer({ ...customer, lastName: e.target.value })} /></label>
            </div>
            <label htmlFor="email">Email<input id="email" required type="email" inputMode="email" autoComplete="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} /></label>
            <label htmlFor="phone">Phone<input id="phone" type="tel" inputMode="tel" autoComplete="tel" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} /></label>

            {/* Pickup time */}
            <div className="panel-divider" />
            <p className="panel-section-label">Pickup time</p>
            <div className={`pickup-status ${status.open ? 'open' : 'closed'}`}>
              <span className="pickup-dot" />
              <span>{status.open ? `Open now · ${status.label}` : 'Closed — no slots available today'}</span>
            </div>
            {status.open ? (
              <div className="slot-grid">
                {slots.map((slot) => (
                  <button
                    key={slot.value}
                    type="button"
                    className={`slot-btn ${pickupTimeIso === slot.value ? 'active' : ''}`}
                    onClick={() => setPickupTimeIso(slot.value)}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="closed-hours">
                <p className="closed-hours-title">Store hours</p>
                {STORE_HOURS.map((h) => <p key={h} className="closed-hours-row">{h}</p>)}
              </div>
            )}

            {/* Comments */}
            <div className="panel-divider" />
            <p className="panel-section-label">Special instructions</p>
            <textarea
              placeholder="Allergies, special requests, or anything we should know…"
              value={orderComment}
              onChange={(e) => setOrderComment(e.target.value)}
            />

            {message && <p className="message" style={{ marginTop: 12 }}>{message}</p>}

            {/* Total + CTA */}
            <div className="total-row">
              <span>Subtotal</span>
              <strong>{money(subtotal)}</strong>
            </div>

            <button className="checkout-button" disabled={loading || cart.length === 0 || !pickupTimeIso}>
              {loading ? 'Creating checkout…' : 'Pay with Clover'}
            </button>

            {/* Trust signal */}
            <div className="panel-trust">
              <ShieldCheck size={13} />
              <span>Secure checkout powered by Clover</span>
            </div>
          </form>
        </aside>
      </section>
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="footer-logo">
              <img src="/logo.png" alt="Gourmet Convenience" className="brand-logo" />
              <div className="brand-text">
                <span className="brand-gourmet">GOURMET</span>
                <span className="brand-convenience">CONVENIENCE</span>
              </div>
            </div>
            <p className="footer-tagline">Simple. Fresh. Your Way.</p>
            <p className="footer-sub">Fresh deli made to order. Pickup only.</p>
          </div>

          <div className="footer-col">
            <p className="footer-col-title">Hours</p>
            {STORE_HOURS.map((h) => <p key={h} className="footer-col-row">{h}</p>)}
          </div>

          <div className="footer-col">
            <p className="footer-col-title">Order</p>
            <p className="footer-col-row"><a href="#order">Build Your Own</a></p>
            <p className="footer-col-row"><a href="#order">Ready-Made Extras</a></p>
            <p className="footer-col-row"><a href="#convenience">Convenience Items</a></p>
          </div>

          <div className="footer-col">
            <p className="footer-col-title">Secure Checkout</p>
            <div className="footer-trust">
              <ShieldCheck size={14} />
              <span>Payments processed by Clover</span>
            </div>
            <div className="footer-trust">
              <Clock size={14} />
              <span>Today’s pickup only</span>
            </div>
            <div className="footer-trust">
              <ShoppingBag size={14} />
              <span>No delivery — in-store pickup</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Gourmet Convenience. All rights reserved.</span>
          <span>Powered by Clover Hosted Checkout</span>
        </div>
      </footer>

      {/* Mobile floating cart bar */}
      {cart.length > 0 && (
        <div className="mobile-cart-bar" onClick={() => setCartOpen(true)}>
          <span className="mobile-cart-count">{cart.reduce((s, i) => s + i.quantity, 0)}</span>
          <span>View your order</span>
          <strong>{money(subtotal)}</strong>
        </div>
      )}

      {cartOpen && (
        <div className="mobile-cart-overlay" onClick={() => setCartOpen(false)}>
          <div className="mobile-cart-drawer" onClick={(e) => e.stopPropagation()}>
            <button className="mobile-cart-close" onClick={() => setCartOpen(false)}>✕ Close</button>
            <form onSubmit={(e) => { setCartOpen(false); handleCheckout(e); }}>
              <div className="cart-list">
                {cart.map((item) => (
                  <div className="cart-item" key={item.cartKey}>
                    <div className="cart-item-info">
                      <strong>{item.name}</strong>
                      {item.displayNote && <p className="cart-note">{item.displayNote}</p>}
                    </div>
                    <div className="cart-item-controls">
                      <div className="quantity-controls">
                        <button type="button" onClick={() => updateCartItem(item.cartKey, { quantity: item.quantity - 1 })}>−</button>
                        <span>{item.quantity}</span>
                        <button type="button" onClick={() => updateCartItem(item.cartKey, { quantity: item.quantity + 1 })}>+</button>
                      </div>
                      <span className="cart-item-price">{money(item.priceCents * item.quantity)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="panel-divider" />
              <p className="panel-section-label">Your details</p>
              <div className="field-grid">
                <label htmlFor="m-firstName">First name<input id="m-firstName" required autoComplete="given-name" value={customer.firstName} onChange={(e) => setCustomer({ ...customer, firstName: e.target.value })} /></label>
                <label htmlFor="m-lastName">Last name<input id="m-lastName" required autoComplete="family-name" value={customer.lastName} onChange={(e) => setCustomer({ ...customer, lastName: e.target.value })} /></label>
              </div>
              <label htmlFor="m-email">Email<input id="m-email" required type="email" inputMode="email" autoComplete="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} /></label>
              <label htmlFor="m-phone">Phone<input id="m-phone" type="tel" inputMode="tel" autoComplete="tel" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} /></label>
              <div className="panel-divider" />
              <p className="panel-section-label">Pickup time</p>
              <div className={`pickup-status ${status.open ? 'open' : 'closed'}`}>
                <span className="pickup-dot" />
                <span>{status.open ? `Open now · ${status.label}` : 'Closed — no slots available today'}</span>
              </div>
              {status.open ? (
                <div className="slot-grid">
                  {slots.map((slot) => (
                    <button
                      key={slot.value}
                      type="button"
                      className={`slot-btn ${pickupTimeIso === slot.value ? 'active' : ''}`}
                      onClick={() => setPickupTimeIso(slot.value)}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="closed-hours">
                  <p className="closed-hours-title">Store hours</p>
                  {STORE_HOURS.map((h) => <p key={h} className="closed-hours-row">{h}</p>)}
                </div>
              )}
              <div className="panel-divider" />
              <textarea placeholder="Special instructions…" value={orderComment} onChange={(e) => setOrderComment(e.target.value)} />
              {message && <p className="message" style={{ marginTop: 12 }}>{message}</p>}
              <div className="total-row"><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
              <button className="checkout-button" disabled={loading || cart.length === 0 || !pickupTimeIso}>
                {loading ? 'Creating checkout…' : 'Pay with Clover'}
              </button>
              <div className="panel-trust"><ShieldCheck size={13} /><span>Secure checkout powered by Clover</span></div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
