import { mapWooProduct, stripHtml, wooPrice, WooProduct } from '../src/data/wooMapping';
import { WooCommerceCatalogRepository } from '../src/data/wooCatalogRepository';

const spray: WooProduct = {
  id: 11, name: 'Levi', type: 'simple', short_description: '<p>Deep, priestly &amp; resinous.</p>', description: '<p>A room spray.</p>',
  prices: { price: '3500', currency_minor_unit: 2 }, images: [{ src: 'https://x/levi.jpg' }],
  categories: [{ slug: 'room-sprays' }], tags: [{ slug: 'subscribe' }],
  attributes: [
    { name: 'Stone', terms: [{ name: 'Carbuncle' }] }, { name: 'Numeral', terms: [{ name: 'III' }] }, { name: 'Character', terms: [{ name: 'Warm' }] },
    { name: 'Top', terms: [{ name: 'Pomegranate' }] }, { name: 'Heart', terms: [{ name: 'Rose' }] }, { name: 'Base', terms: [{ name: 'Frankincense' }] },
  ],
  cross_sell_ids: [20],
};
const incense: WooProduct = {
  id: 20, name: 'Frankincense &amp; Myrrh', type: 'variable', categories: [{ slug: 'incense' }],
  prices: { price: '1800', currency_minor_unit: 2, price_range: { min_amount: '1800' } },
  attributes: [{ name: 'Type', has_variations: true, terms: [{ name: 'Single' }, { name: 'Box of 3' }] }],
};

describe('WooCommerce mapping', () => {
  it('converts minor-unit prices', () => { expect(wooPrice({ price: '3500', currency_minor_unit: 2 })).toBe(35); expect(wooPrice({ price: '1999', currency_minor_unit: 2 })).toBe(19.99); });
  it('strips HTML and decodes entities', () => { expect(stripHtml('<p>Deep &amp; <b>rich</b></p>')).toBe('Deep & rich'); });
  it('maps a tribe spray with stone colour fallback, details and subscribe tag', () => {
    const p = mapWooProduct(spray, [])!;
    expect(p).toMatchObject({ id: 'woo-11', category: 'spray', stone: 'Carbuncle', numeral: 'III', colorHex: '#6E1F35', character: 'Warm', subscribable: true, pairings: ['woo-20'], tagline: 'Deep, priestly & resinous.' });
    expect(p.variants).toEqual([{ id: '11', label: 'Standard', price: 35 }]);
    expect(p.details.map((d) => d.label)).toEqual(['Top', 'Heart', 'Base']);
  });
  it('maps variable products from their variations', () => {
    const p = mapWooProduct(incense, [
      { id: 21, prices: { price: '1800', currency_minor_unit: 2 }, attributes: [{ name: 'Type', value: 'Single' }] },
      { id: 22, prices: { price: '4800', currency_minor_unit: 2 }, attributes: [{ name: 'Type', value: 'Box of 3' }] },
    ])!;
    expect(p.variants.map((v) => [v.id, v.label, v.price])).toEqual([['21', 'Single', 18], ['22', 'Box of 3', 48]]);
    expect(p.name).toBe('Frankincense & Myrrh');
  });
  it('skips uncategorised and unpriced products', () => {
    expect(mapWooProduct({ ...spray, categories: [{ slug: 'merch' }] }, [])).toBeNull();
    expect(mapWooProduct({ ...spray, prices: { price: '0' } }, [])).toBeNull();
  });
});

describe('WooCommerceCatalogRepository', () => {
  const mem = () => { const m: Record<string, unknown> = {}; return { read: async (k: string) => (m[k] as never) ?? null, write: async (k: string, v: unknown) => { m[k] = v; } }; };
  const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body, headers: { get: () => '1' } }) as unknown as Response;
  it('fetches, maps and caches; serves the cache when offline', async () => {
    const store = mem();
    let online = true;
    const fetchImpl = (async (url: string) => { if (!online) throw new Error('offline'); return ok(url.includes('type=variation') ? [] : [spray]); }) as unknown as typeof fetch;
    const repo = new WooCommerceCatalogRepository('https://shop.test/', store, { freeShippingThreshold: 75, fetchImpl });
    const c1 = await repo.getCatalog();
    expect(c1.products).toHaveLength(1); expect(c1.freeShippingThreshold).toBe(75);
    online = false;
    expect((await repo.getCatalog()).products[0].id).toBe('woo-11');
  });
  it('throws when offline with no cache (UI shows its error state)', async () => {
    const fetchImpl = (async () => { throw new Error('offline'); }) as unknown as typeof fetch;
    await expect(new WooCommerceCatalogRepository('https://shop.test', mem(), { freeShippingThreshold: 60, fetchImpl }).getCatalog()).rejects.toThrow();
  });
});
