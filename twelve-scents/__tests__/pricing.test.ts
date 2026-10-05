import {
  unitPrice, lineTotal, subtotal, cartCount, freeShippingRemaining, shippingCost, pointsDiscount, orderTotal,
  pointsEarned, tierFor, rewardProgress, rankForFinder, filterProducts, MOOD_CHARACTERS,
} from '../src/domain/pricing';
import catalog from '../src/data/catalog.json';
import { Product } from '../src/domain/types';

const products = catalog.products as unknown as Product[];

describe('cart math', () => {
  it('sums lines by qty', () => {
    expect(subtotal([{ price: 35, qty: 2, plan: 'once' }, { price: 18, qty: 1, plan: 'once' }])).toBe(88);
  });
  it('counts items for the badge', () => {
    expect(cartCount([{ productId: 'a', variantId: 'v', qty: 2, plan: 'once' }, { productId: 'b', variantId: 'v', qty: 3, plan: 'once' }])).toBe(5);
  });
  it('avoids float drift', () => {
    expect(lineTotal(19.99, 3, 'once')).toBe(59.97);
  });
  it('is zero for an empty cart', () => { expect(subtotal([])).toBe(0); });
});

describe('subscription discount', () => {
  it('takes 10% off a $35 spray', () => { expect(unitPrice(35, 'subscription')).toBe(31.5); });
  it('leaves one-time price alone', () => { expect(unitPrice(35, 'once')).toBe(35); });
  it('applies to line totals', () => { expect(lineTotal(35, 2, 'subscription')).toBe(63); });
});

describe('shipping threshold', () => {
  it('reports the remaining amount', () => { expect(freeShippingRemaining(45, 60)).toBe(15); });
  it('clamps at zero once reached', () => { expect(freeShippingRemaining(75, 60)).toBe(0); });
  it('charges $6 standard under the threshold', () => { expect(shippingCost('standard', 59.99, 60)).toBe(6); });
  it('is free at exactly the threshold', () => { expect(shippingCost('standard', 60, 60)).toBe(0); });
  it('express is always $14', () => { expect(shippingCost('express', 500, 60)).toBe(14); });
  it('honours a configurable threshold', () => { expect(shippingCost('standard', 80, 100)).toBe(6); });
});

describe('points', () => {
  it('redeems 1,000 points for $10 off', () => { expect(pointsDiscount(true, 1000, 88)).toBe(10); });
  it('refuses redemption under 1,000 points', () => { expect(pointsDiscount(true, 999, 88)).toBe(0); });
  it('does nothing when the toggle is off', () => { expect(pointsDiscount(false, 5000, 88)).toBe(0); });
  it('never discounts below the subtotal', () => { expect(pointsDiscount(true, 5000, 6)).toBe(6); });
  it('earns 1 pt per whole dollar, excluding shipping', () => { expect(pointsEarned(88.5, 0)).toBe(88); });
  it('earns on the discounted amount', () => { expect(pointsEarned(88, 10)).toBe(78); });
  it('totals correctly', () => { expect(orderTotal(88, 0, 10)).toBe(78); expect(orderTotal(40, 6, 0)).toBe(46); });
  it('derives tiers', () => { expect(tierFor(0)).toBe('Bronze'); expect(tierFor(2000)).toBe('Silver'); expect(tierFor(6000)).toBe('Gold'); });
  it('tracks the 12-stone progress toward a $20 reward', () => {
    expect(rewardProgress(1000)).toEqual({ stonesLit: 6, pointsToNext: 1000, rewardsAvailable: 0 });
    expect(rewardProgress(2000)).toEqual({ stonesLit: 0, pointsToNext: 2000, rewardsAvailable: 1 });
  });
});

describe('finder ranking', () => {
  it('maps moods to characters as specified', () => {
    expect(MOOD_CHARACTERS).toEqual({ Clean: ['Bright', 'Fresh'], Earthy: ['Grounding'], Warm: ['Warm'], Fresh: ['Fresh', 'Bright'], Rich: ['Warm', 'Grounding'] });
  });
  it('only returns products of the chosen type', () => {
    expect(rankForFinder(products, 'spray', 'Warm').every((p) => p.category === 'spray')).toBe(true);
  });
  it('ranks by first matching character (Clean: Bright before Fresh)', () => {
    const r = rankForFinder(products, 'spray', 'Clean');
    const chars = r.map((p) => p.character);
    expect(chars.indexOf('Bright')).toBeLessThan(chars.indexOf('Fresh'));
    expect(chars.indexOf('Fresh')).toBeLessThan(chars.indexOf('Warm'));
  });
  it('is stable within the same rank', () => {
    const warm = rankForFinder(products, 'spray', 'Warm').filter((p) => p.character === 'Warm').map((p) => p.id);
    const orig = products.filter((p) => p.category === 'spray' && p.character === 'Warm').map((p) => p.id);
    expect(warm).toEqual(orig);
  });
  it('keeps non-matching products last rather than dropping them', () => {
    const r = rankForFinder(products, 'incense', 'Earthy');
    expect(r.length).toBe(products.filter((p) => p.category === 'incense').length);
    expect(r[0].character).toBe('Grounding');
  });
});

describe('catalog + browse filtering', () => {
  it('seeds 12 tribe sprays at $35', () => {
    const s = products.filter((p) => p.category === 'spray');
    expect(s).toHaveLength(12);
    expect(s.every((p) => p.variants[0].price === 35 && p.subscribable)).toBe(true);
  });
  it('searches by stone', () => { expect(filterProducts(products, 'all', 'emerald', 'featured').map((p) => p.name)).toEqual(['Judah']); });
  it('filters by category and sorts A–Z', () => {
    const n = filterProducts(products, 'spray', '', 'az').map((p) => p.name);
    expect(n).toEqual([...n].sort((a, b) => a.localeCompare(b)));
  });
  it('sorts by price ascending', () => {
    const p = filterProducts(products, 'rock', '', 'price').map((x) => Math.min(...x.variants.map((v) => v.price)));
    expect(p).toEqual([...p].sort((a, b) => a - b));
  });
});
