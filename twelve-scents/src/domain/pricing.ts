import { CartItem, Category, Character, Mood, Plan, Product } from './types';

export const SUBSCRIPTION_DISCOUNT = 0.1;
export const POINTS_REDEEM_COST = 1000;
export const POINTS_REDEEM_VALUE = 10;
export const REWARD_STEP_POINTS = 2000;
export const REWARD_STEP_VALUE = 20;

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function unitPrice(base: number, plan: Plan): number {
  return plan === 'subscription' ? round2(base * (1 - SUBSCRIPTION_DISCOUNT)) : base;
}
export function lineTotal(base: number, qty: number, plan: Plan): number {
  return round2(unitPrice(base, plan) * qty);
}
export function subtotal(items: { price: number; qty: number; plan: Plan }[]): number {
  return round2(items.reduce((s, i) => s + lineTotal(i.price, i.qty, i.plan), 0));
}
export function cartCount(items: CartItem[]): number {
  return items.reduce((s, i) => s + i.qty, 0);
}
/** Points can be redeemed only in whole blocks and never beyond the balance/subtotal. */
export function pointsDiscount(usePoints: boolean, balance: number, sub: number): number {
  if (!usePoints || balance < POINTS_REDEEM_COST) return 0;
  return Math.min(POINTS_REDEEM_VALUE, sub);
}
export function orderTotal(sub: number, shipping: number, discount: number): number {
  return Math.max(0, round2(sub + shipping - discount));
}
/** 1 point per whole dollar of merchandise spend (after discount, before shipping). */
export function pointsEarned(sub: number, discount: number): number {
  return Math.max(0, Math.floor(sub - discount));
}
export function tierFor(points: number): string {
  if (points >= 6000) return 'Gold';
  if (points >= 2000) return 'Silver';
  return 'Bronze';
}
/** Progress toward next $20 reward: stones lit out of 12. */
export function rewardProgress(points: number) {
  const into = points % REWARD_STEP_POINTS;
  return {
    stonesLit: Math.floor((into / REWARD_STEP_POINTS) * 12),
    pointsToNext: REWARD_STEP_POINTS - into,
    rewardsAvailable: Math.floor(points / REWARD_STEP_POINTS),
  };
}

// ---------- Finder ----------
export const MOOD_CHARACTERS: Record<Mood, Character[]> = {
  Clean: ['Bright', 'Fresh'],
  Earthy: ['Grounding'],
  Warm: ['Warm'],
  Fresh: ['Fresh', 'Bright'],
  Rich: ['Warm', 'Grounding'],
};
export type FinderType = Extract<Category, 'spray' | 'incense' | 'rock' | 'oil'>;

/** Products of the chosen type, ranked by index of first matching character (stable, non-matches last). */
export function rankForFinder(products: Product[], type: Category, mood: Mood): Product[] {
  const wanted = MOOD_CHARACTERS[mood];
  const rank = (p: Product) => {
    const i = wanted.indexOf(p.character);
    return i === -1 ? wanted.length : i;
  };
  return products
    .map((p, idx) => ({ p, idx }))
    .filter(({ p }) => p.category === type)
    .sort((a, b) => rank(a.p) - rank(b.p) || a.idx - b.idx)
    .map(({ p }) => p);
}

// ---------- Browse ----------
export type SortKey = 'featured' | 'price' | 'az';
export const basePrice = (p: Product) => Math.min(...p.variants.map((v) => v.price));

export function filterProducts(products: Product[], shelf: Shelf | 'all', query: string, sort: SortKey): Product[] {
  const q = query.trim().toLowerCase();
  const hay = (p: Product) =>
    [p.name, p.stone, p.numeral, p.category, categoryLabel(p.category), SHELF_LABELS[shelfOf(p)], p.character, p.tagline,
      ...p.details.map((d) => d.value)].filter(Boolean).join(' ').toLowerCase();
  let out = products.filter((p) => (shelf === 'all' || shelfOf(p) === shelf) && (!q || hay(p).includes(q)));
  if (sort === 'price') out = [...out].sort((a, b) => basePrice(a) - basePrice(b));
  if (sort === 'az') out = [...out].sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  spray: 'Room Sprays', incense: 'Incense', rock: 'Rock Incense', oil: 'Burning Oils', censer: 'Brass Censers', charcoal: 'Charcoal',
};
export const categoryLabel = (c: Category) => CATEGORY_LABELS[c];

/** Browse shelves: the categories, with the Twelve Tribes sprays split out of Room Sprays. */
export type Shelf = 'tribes' | Category;
export const SHELVES: Shelf[] = ['tribes', 'spray', 'incense', 'rock', 'oil', 'censer', 'charcoal'];
export const SHELF_LABELS: Record<Shelf, string> = { tribes: '12 Tribes Collection', ...CATEGORY_LABELS };
export const isShelf = (s: string): s is Shelf => (SHELVES as string[]).includes(s);
/** Twelve Tribes spray. Undefined `tribe` is treated as true for stone-bearing sprays. */
export const isTribe = (p: Product) => p.category === 'spray' && (p.tribe ?? !!p.stone);
export const shelfOf = (p: Product): Shelf => (isTribe(p) ? 'tribes' : p.category);
export const CATEGORY_KICKER: Record<Category, string> = {
  spray: 'ROOM SPRAY', incense: 'HAND-BUNDLED INCENSE', rock: 'ROCK INCENSE', oil: 'BURNING OIL', censer: 'BRASS CENSER', charcoal: 'CHARCOAL',
};
/** Brand claim: three pumps freshen a room for up to three days (not a product count). */
export const SPRAY_CLAIM = '3 sprays · up to 3 days';
export const money = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;
