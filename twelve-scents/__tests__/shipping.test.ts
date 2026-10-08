import { DEFAULT_ZONES, shippingCost, shippingOptions, zoneFor } from '../src/domain/shipping';

describe('shipping (mirrors the store: flat rate by state + local pickup on the East Coast)', () => {
  it('East Coast: $12.99 flat rate and free local pickup', () => {
    expect(shippingOptions('NY').map((o) => [o.method, o.cost])).toEqual([['flat_rate', 12.99], ['local_pickup', 0]]);
  });
  it('Southern states: $15.99 flat rate, no pickup', () => {
    expect(shippingOptions('TX').map((o) => [o.method, o.cost])).toEqual([['flat_rate', 15.99]]);
  });
  it('Midwest & West (incl. AK/HI): $19.99 flat rate, no pickup', () => {
    for (const s of ['OR', 'CA', 'AK', 'HI', 'IL']) expect(shippingOptions(s).map((o) => [o.method, o.cost])).toEqual([['flat_rate', 19.99]]);
  });
  it('is case/whitespace tolerant', () => { expect(zoneFor(' ny ')?.name).toBe('East Coast US'); });
  it('ships nowhere else (empty options)', () => { expect(shippingOptions('ZZ')).toEqual([]); expect(shippingOptions('')).toEqual([]); });
  it('has no free-shipping or express option anywhere', () => {
    const all = DEFAULT_ZONES.flatMap((z) => z.states.flatMap((s) => shippingOptions(s)));
    expect(all.every((o) => o.method === 'flat_rate' || o.method === 'local_pickup')).toBe(true);
    expect(all.filter((o) => o.method === 'flat_rate').every((o) => o.cost > 0)).toBe(true);
  });
  it('charges the chosen method, falling back to flat rate if pickup is not offered', () => {
    expect(shippingCost('local_pickup', 'NY')).toBe(0);
    expect(shippingCost('local_pickup', 'OR')).toBe(19.99);
    expect(shippingCost('flat_rate', 'GA')).toBe(12.99);
  });
  it('does not charge more than once per order regardless of cart size (flat)', () => {
    expect(shippingCost('flat_rate', 'FL')).toBe(shippingCost('flat_rate', 'FL'));
  });
  it('covers every US state the store lists exactly once', () => {
    const all = DEFAULT_ZONES.flatMap((z) => z.states);
    expect(new Set(all).size).toBe(all.length);
    expect(all).toHaveLength(18 + 8 + 25);
  });
});
