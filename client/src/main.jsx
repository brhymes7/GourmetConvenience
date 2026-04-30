import React from 'react';
import { createRoot } from 'react-dom/client';
import { ShoppingBag, Clock, ShieldCheck, ChevronRight } from 'lucide-react';
import {
  adminLogin,
  createCheckout,
  createAdminMenuItem,
  createAdminPickupWindow,
  deleteAdminMenuItem,
  deleteAdminPickupWindow,
  fetchAdminMenu,
  fetchAdminOrders,
  fetchAdminPickupWindows,
  fetchAdminStoreStatus,
  fetchAvailability,
  fetchMenu,
  updateAdminMenuItem,
  updateAdminPickupWindow,
  updateAdminStoreStatus
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
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const emptyItem = { name: '', description: '', price: '', category: '', image: '', active: true, featured: false, popular: false };
  const emptyWindow = { day: 'monday', open: '09:00', close: '17:00', active: true, maxOrders: '' };
  const [token, setToken] = React.useState(() => window.localStorage.getItem('adminToken') || '');
  const [password, setPassword] = React.useState('');
  const [orders, setOrders] = React.useState([]);
  const [menuItems, setMenuItems] = React.useState([]);
  const [categories, setCategories] = React.useState([]);
  const [pickupWindows, setPickupWindows] = React.useState([]);
  const [storeStatus, setStoreStatus] = React.useState({ acceptOrders: true, closedMessage: '', cutoffMessage: '', leadTimeMinutes: 15, slotIntervalMinutes: 15, timezone: 'America/New_York' });
  const [itemDraft, setItemDraft] = React.useState(emptyItem);
  const [editingItemId, setEditingItemId] = React.useState('');
  const [windowDraft, setWindowDraft] = React.useState(emptyWindow);
  const [editingWindow, setEditingWindow] = React.useState(null);
  const [message, setMessage] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  function dayLabel(day) {
    return day.charAt(0).toUpperCase() + day.slice(1);
  }

  function toItemDraft(item) {
    return {
      name: item.name || '',
      description: item.description || '',
      price: ((item.priceCents || 0) / 100).toFixed(2),
      category: item.category || '',
      image: item.image || '',
      active: item.active !== false,
      featured: Boolean(item.featured),
      popular: Boolean(item.popular)
    };
  }

  function itemPayload(draft) {
    return {
      name: draft.name,
      description: draft.description,
      priceCents: Math.round(Number(draft.price) * 100),
      category: draft.category,
      image: draft.image,
      active: draft.active,
      featured: draft.featured,
      popular: draft.popular
    };
  }

  async function loadAdminData(authToken = token) {
    if (!authToken) return;
    setLoading(true);
    setMessage('');
    try {
      const [ordersData, menuData, windowsData, statusData] = await Promise.all([
        fetchAdminOrders(authToken),
        fetchAdminMenu(authToken),
        fetchAdminPickupWindows(authToken),
        fetchAdminStoreStatus(authToken)
      ]);
      setOrders(ordersData.orders || []);
      setMenuItems(menuData.menu || []);
      setCategories(menuData.categories || []);
      setPickupWindows(windowsData.pickupWindows || []);
      setStoreStatus(statusData.storeStatus || storeStatus);
    } catch (err) {
      setMessage(err.message);
      if (err.message.toLowerCase().includes('admin')) {
        window.localStorage.removeItem('adminToken');
        setToken('');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const data = await adminLogin(password);
      setToken(data.token);
      window.localStorage.setItem('adminToken', data.token);
      setPassword('');
      setMessage('Logged in.');
      await loadAdminData(data.token);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    window.localStorage.removeItem('adminToken');
    setToken('');
    setOrders([]);
    setMenuItems([]);
    setPickupWindows([]);
  }

  async function saveItem(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const data = editingItemId
        ? await updateAdminMenuItem(token, editingItemId, itemPayload(itemDraft))
        : await createAdminMenuItem(token, itemPayload(itemDraft));
      setMenuItems(data.menu || []);
      setCategories([...new Set((data.menu || []).map((item) => item.category).filter(Boolean))].sort());
      setItemDraft(emptyItem);
      setEditingItemId('');
      setMessage(editingItemId ? 'Menu item updated.' : 'Menu item added.');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function removeItem(item) {
    if (!window.confirm(`Delete ${item.name}? This removes it from the menu.`)) return;
    setLoading(true);
    setMessage('');
    try {
      const data = await deleteAdminMenuItem(token, item.id);
      setMenuItems(data.menu || []);
      setMessage('Menu item deleted.');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleItem(item) {
    const data = await updateAdminMenuItem(token, item.id, { ...item, active: !item.active });
    setMenuItems(data.menu || []);
    setMessage(item.active ? 'Item disabled.' : 'Item enabled.');
  }

  async function savePickupWindow(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const payload = { ...windowDraft, maxOrders: windowDraft.maxOrders === '' ? null : Number(windowDraft.maxOrders) };
      const data = editingWindow
        ? await updateAdminPickupWindow(token, editingWindow.day, editingWindow.index, payload)
        : await createAdminPickupWindow(token, payload);
      setPickupWindows(data.pickupWindows || []);
      setWindowDraft(emptyWindow);
      setEditingWindow(null);
      setMessage(editingWindow ? 'Pickup window updated.' : 'Pickup window added.');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function removePickupWindow(windowItem) {
    if (!window.confirm(`Delete ${dayLabel(windowItem.day)} ${windowItem.open} - ${windowItem.close}?`)) return;
    setLoading(true);
    setMessage('');
    try {
      const data = await deleteAdminPickupWindow(token, windowItem.day, windowItem.index);
      setPickupWindows(data.pickupWindows || []);
      setMessage('Pickup window deleted.');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveStoreStatus(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const data = await updateAdminStoreStatus(token, storeStatus);
      setStoreStatus(data.storeStatus);
      setMessage('Store status saved.');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    if (token) loadAdminData(token);
  }, []);

  if (!token) {
    return (
      <main className="admin-page admin-login-page">
        <section className="status-card admin-auth-card">
          <img src="/logo.png" alt="Gourmet Convenience" className="status-logo" />
          <p className="eyebrow">Admin Login</p>
          <h1>Store Operations</h1>
          <p className="status-copy">Sign in to manage menu items, pricing, availability, and pickup windows.</p>
          <form onSubmit={handleLogin} className="admin-auth-form">
            <label htmlFor="admin-password">Admin password
              <input id="admin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
            </label>
            {message && <p className="message">{message}</p>}
            <button className="button primary" type="submit" disabled={loading || !password}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Store Operations</h1>
        </div>
        <div className="admin-header-actions">
          <button type="button" className="button secondary" onClick={() => loadAdminData()} disabled={loading}>Refresh</button>
          <a href="/" className="button secondary">Storefront</a>
          <button type="button" className="button secondary" onClick={logout}>Log out</button>
        </div>
      </header>
      {message && <p className="message admin-message">{message}</p>}

      <section className="admin-grid">
        <div className="admin-panel admin-summary">
          <div className="admin-panel-head">
            <h2>Dashboard</h2>
          </div>
          <div className="admin-stats">
            <div><strong>{menuItems.length}</strong><span>Menu items</span></div>
            <div><strong>{categories.length}</strong><span>Categories</span></div>
            <div><strong>{pickupWindows.length}</strong><span>Pickup windows</span></div>
            <div><strong>{storeStatus.acceptOrders ? 'Open' : 'Closed'}</strong><span>Store status</span></div>
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-head">
            <h2>Store Status</h2>
          </div>
          <form className="admin-form" onSubmit={saveStoreStatus}>
            <label className="admin-toggle"><input type="checkbox" checked={storeStatus.acceptOrders} onChange={(e) => setStoreStatus({ ...storeStatus, acceptOrders: e.target.checked })} /> Accept online orders</label>
            <label>Closed message<input value={storeStatus.closedMessage || ''} onChange={(e) => setStoreStatus({ ...storeStatus, closedMessage: e.target.value })} placeholder="Pickup resumes tomorrow at 9 AM" /></label>
            <label>Cutoff message<input value={storeStatus.cutoffMessage || ''} onChange={(e) => setStoreStatus({ ...storeStatus, cutoffMessage: e.target.value })} placeholder="No more pickup slots today." /></label>
            <div className="field-grid">
              <label>Lead time minutes<input type="number" min="0" value={storeStatus.leadTimeMinutes} onChange={(e) => setStoreStatus({ ...storeStatus, leadTimeMinutes: e.target.value })} /></label>
              <label>Slot interval minutes<input type="number" min="1" value={storeStatus.slotIntervalMinutes} onChange={(e) => setStoreStatus({ ...storeStatus, slotIntervalMinutes: e.target.value })} /></label>
            </div>
            <button type="submit" className="admin-save" disabled={loading}>Save status</button>
          </form>
        </div>

        <div className="admin-panel wide">
          <div className="admin-panel-head">
            <h2>Menu</h2>
            <span className="admin-empty">{menuItems.length} items</span>
          </div>
          <form className="admin-form admin-menu-form" onSubmit={saveItem}>
            <div className="field-grid">
              <label>Name<input value={itemDraft.name} onChange={(e) => setItemDraft({ ...itemDraft, name: e.target.value })} required /></label>
              <label>Price<input type="number" min="0" step="0.01" value={itemDraft.price} onChange={(e) => setItemDraft({ ...itemDraft, price: e.target.value })} required /></label>
            </div>
            <label>Description<textarea value={itemDraft.description} onChange={(e) => setItemDraft({ ...itemDraft, description: e.target.value })} /></label>
            <div className="field-grid">
              <label>Category<input list="admin-categories" value={itemDraft.category} onChange={(e) => setItemDraft({ ...itemDraft, category: e.target.value })} required /></label>
              <label>Image URL<input value={itemDraft.image} onChange={(e) => setItemDraft({ ...itemDraft, image: e.target.value })} /></label>
            </div>
            <datalist id="admin-categories">{categories.map((category) => <option key={category} value={category} />)}</datalist>
            <div className="admin-checks">
              <label><input type="checkbox" checked={itemDraft.active} onChange={(e) => setItemDraft({ ...itemDraft, active: e.target.checked })} /> Available</label>
              <label><input type="checkbox" checked={itemDraft.featured} onChange={(e) => setItemDraft({ ...itemDraft, featured: e.target.checked })} /> Featured</label>
              <label><input type="checkbox" checked={itemDraft.popular} onChange={(e) => setItemDraft({ ...itemDraft, popular: e.target.checked })} /> Popular</label>
            </div>
            <div className="admin-form-actions">
              <button type="submit" className="admin-save" disabled={loading}>{editingItemId ? 'Save item' : 'Add item'}</button>
              {editingItemId && <button type="button" className="admin-secondary" onClick={() => { setEditingItemId(''); setItemDraft(emptyItem); }}>Cancel</button>}
            </div>
          </form>
          <div className="admin-menu-list">
            {menuItems.map((item) => (
              <article className={`admin-menu-item ${item.active ? '' : 'disabled'}`} key={item.id}>
                <img src={item.image || '/logo.png'} alt="" />
                <div>
                  <strong>{item.name}</strong>
                  <p>{item.category} · {money(item.priceCents)} · {item.active ? 'Available' : 'Hidden'}</p>
                </div>
                <div className="admin-row-actions">
                  <button type="button" onClick={() => { setEditingItemId(item.id); setItemDraft(toItemDraft(item)); }}>Edit</button>
                  <button type="button" onClick={() => toggleItem(item)}>{item.active ? 'Disable' : 'Enable'}</button>
                  <button type="button" className="danger" onClick={() => removeItem(item)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="admin-panel wide">
          <div className="admin-panel-head">
            <h2>Pickup Windows</h2>
            <span className="admin-empty">Controls customer pickup times</span>
          </div>
          <form className="admin-form admin-window-form" onSubmit={savePickupWindow}>
            <div className="admin-window-grid">
              <label>Day<select value={windowDraft.day} onChange={(e) => setWindowDraft({ ...windowDraft, day: e.target.value })}>{days.map((day) => <option key={day} value={day}>{dayLabel(day)}</option>)}</select></label>
              <label>Start<input type="time" value={windowDraft.open} onChange={(e) => setWindowDraft({ ...windowDraft, open: e.target.value })} required /></label>
              <label>End<input type="time" value={windowDraft.close} onChange={(e) => setWindowDraft({ ...windowDraft, close: e.target.value })} required /></label>
              <label>Max orders<input type="number" min="0" value={windowDraft.maxOrders || ''} onChange={(e) => setWindowDraft({ ...windowDraft, maxOrders: e.target.value })} placeholder="Optional" /></label>
            </div>
            <label className="admin-toggle"><input type="checkbox" checked={windowDraft.active} onChange={(e) => setWindowDraft({ ...windowDraft, active: e.target.checked })} /> Pickup window active</label>
            <div className="admin-form-actions">
              <button type="submit" className="admin-save" disabled={loading}>{editingWindow ? 'Save window' : 'Add window'}</button>
              {editingWindow && <button type="button" className="admin-secondary" onClick={() => { setEditingWindow(null); setWindowDraft(emptyWindow); }}>Cancel</button>}
            </div>
          </form>
          <div className="pickup-window-list">
            {pickupWindows.length === 0 ? <p className="admin-empty">No pickup windows configured.</p> : pickupWindows.map((windowItem) => (
              <article className={`pickup-window-row ${windowItem.active ? '' : 'disabled'}`} key={windowItem.id}>
                <div>
                  <strong>{dayLabel(windowItem.day)} {windowItem.open} - {windowItem.close}</strong>
                  <p>{windowItem.active ? 'Customers can choose this window' : 'Disabled'}{windowItem.maxOrders ? ` · Max ${windowItem.maxOrders} orders` : ''}</p>
                </div>
                <div className="admin-row-actions">
                  <button type="button" onClick={() => { setEditingWindow(windowItem); setWindowDraft({ day: windowItem.day, open: windowItem.open, close: windowItem.close, active: windowItem.active, maxOrders: windowItem.maxOrders || '' }); }}>Edit</button>
                  <button type="button" onClick={() => updateAdminPickupWindow(token, windowItem.day, windowItem.index, { ...windowItem, active: !windowItem.active }).then((data) => { setPickupWindows(data.pickupWindows || []); setMessage(windowItem.active ? 'Pickup window disabled.' : 'Pickup window enabled.'); }).catch((err) => setMessage(err.message))}>{windowItem.active ? 'Disable' : 'Enable'}</button>
                  <button type="button" className="danger" onClick={() => removePickupWindow(windowItem)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="admin-panel wide">
          <div className="admin-panel-head">
            <h2>Recent Orders</h2>
          </div>
          <div className="admin-orders">
            {orders.length === 0 ? (
              <p className="admin-empty">No orders yet.</p>
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
