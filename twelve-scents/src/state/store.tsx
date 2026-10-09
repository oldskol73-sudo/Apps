import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { asyncLocalStore } from '@/data/asyncLocalStore';
import { CartItem, Order, Plan, Product, ShippingMethod, Subscription, User, Address } from '@/domain/types';
import { pointsEarned as calcPoints, tierFor, unitPrice } from '@/domain/pricing';
import { track } from '@/services/analytics';

interface Persisted { cart: CartItem[]; user: User; subscriptions: Subscription[]; orders: Order[] }
interface State extends Persisted { hydrated: boolean; toast: { id: number; message: string } | null }

const DEMO_USER: User = {
  name: 'Naomi',
  address: { name: 'Naomi Cohen', line1: '12 Orchard Lane', city: 'Portland', region: 'OR', postcode: '97201' },
  points: 1340, tier: 'Bronze', favourites: [],
};
const addWeeks = (iso: string, w: number) => { const d = new Date(iso); d.setDate(d.getDate() + w * 7); return d.toISOString(); };
const daysFromNow = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString(); };

const initial: State = {
  hydrated: false, toast: null, cart: [], user: DEMO_USER,
  // Demo seed data so Account has content; real data comes from the backend when signed in.
  subscriptions: [{ id: 'sub-1', productId: 'spray-judah', variantId: 'spray-judah-100', intervalWeeks: 6, nextDate: daysFromNow(12), skipped: false }],
  orders: [{
    id: 'TS-104218', date: daysFromNow(-30), total: 48.5, pointsEarned: 42,
    items: [{ productId: 'incense-frankincense-myrrh', variantId: 'incense-frankincense-myrrh-handbundledincense', qty: 1, plan: 'once', unitPrice: 18 },
      { productId: 'spray-levi', variantId: 'spray-levi-100', qty: 1, plan: 'once', unitPrice: 35 }],
  }],
};

type Action =
  | { type: 'hydrate'; data: Persisted | null }
  | { type: 'add'; item: CartItem }
  | { type: 'qty'; productId: string; variantId: string; plan: Plan; qty: number }
  | { type: 'fav'; id: string }
  | { type: 'address'; address: Address }
  | { type: 'order'; order: Order; subs: Subscription[]; spentPoints: number }
  | { type: 'skip'; id: string; skipped: boolean }
  | { type: 'clearCart' }
  | { type: 'toast'; message: string | null };

const same = (a: CartItem, b: { productId: string; variantId: string; plan: Plan }) =>
  a.productId === b.productId && a.variantId === b.variantId && a.plan === b.plan;

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'hydrate':
      return { ...s, ...(a.data ?? {}), hydrated: true };
    case 'add': {
      const i = s.cart.findIndex((c) => same(c, a.item));
      const cart = i >= 0 ? s.cart.map((c, k) => (k === i ? { ...c, qty: c.qty + a.item.qty } : c)) : [...s.cart, a.item];
      return { ...s, cart };
    }
    case 'qty': {
      const cart = s.cart.map((c) => (same(c, a) ? { ...c, qty: a.qty } : c)).filter((c) => c.qty > 0);
      return { ...s, cart };
    }
    case 'fav': {
      const f = s.user.favourites;
      return { ...s, user: { ...s.user, favourites: f.includes(a.id) ? f.filter((x) => x !== a.id) : [...f, a.id] } };
    }
    case 'address':
      return { ...s, user: { ...s.user, address: a.address } };
    case 'order': {
      const points = s.user.points - a.spentPoints + a.order.pointsEarned;
      return { ...s, cart: [], orders: [a.order, ...s.orders], subscriptions: [...s.subscriptions, ...a.subs], user: { ...s.user, points, tier: tierFor(points) } };
    }
    case 'skip':
      return { ...s, subscriptions: s.subscriptions.map((x) => (x.id === a.id ? { ...x, skipped: a.skipped } : x)) };
    case 'clearCart':
      return { ...s, cart: [] };
    case 'toast':
      return { ...s, toast: a.message ? { id: Date.now(), message: a.message } : null };
  }
}

interface PlaceOrderArgs { items: { product: Product; variantId: string; qty: number; plan: Plan }[]; total: number; discount: number; subtotal: number; spentPoints: number; shipping: ShippingMethod }

interface Api {
  state: State;
  addToCart(product: Product, variantId: string, qty?: number, plan?: Plan): void;
  setQty(item: CartItem, qty: number): void;
  /** Empties the bag, e.g. after the order was placed on the website. */
  clearCart(): void;
  toggleFavourite(id: string): void;
  setAddress(a: Address): void;
  placeOrder(args: PlaceOrderArgs): Order;
  setSkipped(id: string, skipped: boolean): void;
  dismissToast(): void;
}
const Ctx = createContext<Api | null>(null);
const KEY = 'ts.state.v1';
export const nextDeliveryDate = (s: Subscription) => (s.skipped ? addWeeks(s.nextDate, s.intervalWeeks) : s.nextDate);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const counter = useRef(0);

  useEffect(() => { asyncLocalStore.read<Persisted>(KEY).then((d) => dispatch({ type: 'hydrate', data: d })); }, []);
  useEffect(() => {
    if (!state.hydrated) return;
    const { cart, user, subscriptions, orders } = state;
    asyncLocalStore.write<Persisted>(KEY, { cart, user, subscriptions, orders });
  }, [state.cart, state.user, state.subscriptions, state.orders, state.hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  const addToCart = useCallback((product: Product, variantId: string, qty = 1, plan: Plan = 'once') => {
    dispatch({ type: 'add', item: { productId: product.id, variantId, qty, plan } });
    dispatch({ type: 'toast', message: `${product.name} added` });
    const price = product.variants.find((v) => v.id === variantId)?.price ?? 0;
    track('add_to_cart', { item_id: product.id, value: unitPrice(price, plan) * qty, plan });
    if (plan === 'subscription') track('subscribe', { item_id: product.id });
  }, []);

  const api = useMemo<Api>(() => ({
    state, addToCart,
    setQty: (item, qty) => dispatch({ type: 'qty', productId: item.productId, variantId: item.variantId, plan: item.plan, qty }),
    clearCart: () => dispatch({ type: 'clearCart' }),
    toggleFavourite: (id) => dispatch({ type: 'fav', id }),
    setAddress: (address) => dispatch({ type: 'address', address }),
    setSkipped: (id, skipped) => dispatch({ type: 'skip', id, skipped }),
    dismissToast: () => dispatch({ type: 'toast', message: null }),
    placeOrder: ({ items, total, discount, subtotal, spentPoints }) => {
      counter.current += 1;
      const order: Order = {
        id: `TS-${String(Date.now()).slice(-6)}${counter.current}`, date: new Date().toISOString(), total,
        pointsEarned: calcPoints(subtotal, discount),
        items: items.map((i) => ({ productId: i.product.id, variantId: i.variantId, qty: i.qty, plan: i.plan,
          unitPrice: unitPrice(i.product.variants.find((v) => v.id === i.variantId)?.price ?? 0, i.plan) })),
      };
      const subs: Subscription[] = items.filter((i) => i.plan === 'subscription').map((i, k) => ({
        id: `sub-${Date.now()}-${k}`, productId: i.product.id, variantId: i.variantId, intervalWeeks: 6, nextDate: addWeeks(order.date, 6), skipped: false,
      }));
      dispatch({ type: 'order', order, subs, spentPoints });
      return order;
    },
  }), [state, addToCart]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
export function useStore(): Api {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore outside StoreProvider');
  return v;
}
