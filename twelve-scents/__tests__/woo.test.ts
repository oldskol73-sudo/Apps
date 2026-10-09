import { groupProducts, inferCharacter, mapWooProduct, splitName, stripHtml, wooPrice, WooProduct } from '../src/data/wooMapping';
import { WooCommerceCatalogRepository } from '../src/data/wooCatalogRepository';
import { filterProducts } from '../src/domain/pricing';

const levi: WooProduct = {
  id: 87, name: 'Levi', type: 'simple', is_in_stock: true, short_description: 'Clean, elevated fragrance. 3-day.',
  description: '<p>Leaves the air feeling ordered and elevated.</p>', prices: { price: '500', currency_minor_unit: 2 },
  images: [{ src: 'https://x/LEVI.png' }], categories: [{ slug: 'twelve-tribes-collection' }], tags: [],
};
const inc = (id: number, name: string, price: string, inStock = true): WooProduct => ({
  id, name, type: 'simple', is_in_stock: inStock, prices: { price, currency_minor_unit: 2 }, categories: [{ slug: 'incense' }],
  short_description: 'Hand-bundled sticks.', images: [{ src: `https://x/${id}.png` }],
});
const charcoal: WooProduct = { id: 71, name: 'Gold Star Charcoal — Box', prices: { price: '1500', currency_minor_unit: 2 }, categories: [{ slug: 'charcoal' }], is_in_stock: true };

describe('WooCommerce mapping (twelve12scents.com shape)', () => {
  it('converts minor-unit prices', () => { expect(wooPrice({ price: '3500', currency_minor_unit: 2 })).toBe(35); expect(wooPrice({ price: '1999', currency_minor_unit: 2 })).toBe(19.99); });
  it('strips HTML and decodes entities', () => { expect(stripHtml('<p>Deep &amp; <b>rich</b></p>')).toBe('Deep & rich'); });
  it('splits size labels off the product name', () => {
    expect(splitName('11″ Incense — 100 Sticks')).toEqual({ base: '11″ Incense', label: '100 Sticks' });
    expect(splitName('Levi')).toEqual({ base: 'Levi', label: null });
  });
  it('maps a tribe spray: stone, numeral and swatch from the tribe table, tribe flag, inferred character', () => {
    const p = mapWooProduct(levi, [])!;
    expect(p).toMatchObject({ id: 'woo-87', category: 'spray', name: 'Levi', stone: 'Carbuncle', numeral: 'III', colorHex: '#6E1F35', tribe: true, character: 'Bright', subscribable: false, tagline: 'Clean, elevated fragrance. 3-day.' });
    expect(p.variants).toEqual([{ id: '87', label: 'Standard', price: 5, inStock: true }]);
    expect(p.details).toEqual([]);
  });
  it('gives Ephraim (Onyx) a solid black swatch and Manasseh (Beryl) dark brown', () => {
    const e = mapWooProduct({ ...levi, id: 85, name: 'Ephraim' }, [])!;
    expect(e).toMatchObject({ tribe: true, stone: 'Onyx', numeral: undefined, colorHex: '#1A1715', colorHex2: undefined });
    const m = mapWooProduct({ ...levi, id: 88, name: 'Manasseh' }, [])!;
    expect(m).toMatchObject({ tribe: true, stone: 'Beryl', numeral: undefined, colorHex: '#4A2C1A', colorHex2: undefined });
  });
  it('treats non-tribe fresheners as sprays without a stone', () => {
    const p = mapWooProduct({ ...levi, id: 93, name: 'Black Ice', categories: [{ slug: 'room-car-fresheners' }] }, [])!;
    expect(p).toMatchObject({ category: 'spray', tribe: false, stone: undefined });
  });
  it('maps variable products from their variations if the store adopts them', () => {
    const p = mapWooProduct({ ...inc(20, 'Frankincense', '1800'), type: 'variable' }, [
      { id: 21, prices: { price: '1800', currency_minor_unit: 2 }, attributes: [{ name: 'Type', value: 'Single' }] },
      { id: 22, is_in_stock: false, prices: { price: '4800', currency_minor_unit: 2 }, attributes: [{ name: 'Type', value: 'Box of 3' }] },
    ])!;
    expect(p.variants.map((v) => [v.id, v.label, v.price, v.inStock])).toEqual([['21', 'Single', 18, true], ['22', 'Box of 3', 48, false]]);
  });
  it('skips uncategorised and unpriced products', () => {
    expect(mapWooProduct({ ...levi, categories: [{ slug: 'merch' }] }, [])).toBeNull();
    expect(mapWooProduct({ ...levi, prices: { price: '0' } }, [])).toBeNull();
  });
  it('infers character from the store copy', () => {
    expect(inferCharacter('Warm, abundant fragrance')).toBe('Warm');
    expect(inferCharacter('Fresh, clean linen')).toBe('Fresh');
    expect(inferCharacter('Mahogany Teakwood')).toBe('Grounding');
    expect(inferCharacter('')).toBe('Warm');
  });
});

describe('grouping + pairings', () => {
  const mapped = [inc(60, '11″ Incense — 100 Sticks', '600'), inc(61, '19″ Incense — 30 Sticks', '1250', false), inc(62, '11″ Incense — 5 Pack Bundle', '2500'), charcoal]
    .map((p) => mapWooProduct(p, [])!);
  it('merges size listings into one product with variants and keeps sold-out flags', () => {
    const g = groupProducts(mapped);
    const i11 = g.find((p) => p.name === '11″ Incense')!;
    expect(i11.variants.map((v) => [v.id, v.label, v.price])).toEqual([['60', '100 Sticks', 6], ['62', '5 Pack Bundle', 25]]);
    expect(g.find((p) => p.name === '19″ Incense')!.variants[0].inStock).toBe(false);
    expect(g).toHaveLength(3);
  });
  it('does not merge differently-named standard products', () => {
    expect(groupProducts([mapWooProduct(levi, [])!, mapWooProduct({ ...levi, id: 84, name: 'Gad' }, [])!])).toHaveLength(2);
  });
});

describe('WooCommerceCatalogRepository', () => {
  const mem = () => { const m: Record<string, unknown> = {}; return { read: async (k: string) => (m[k] as never) ?? null, write: async (k: string, v: unknown) => { m[k] = v; } }; };
  const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body, headers: { get: () => '1' } }) as unknown as Response;
  it('fetches, maps and caches; serves the cache when offline', async () => {
    const store = mem();
    let online = true;
    const fetchImpl = (async (url: string) => { if (!online) throw new Error('offline'); return ok(url.includes('type=variation') ? [] : [levi]); }) as unknown as typeof fetch;
    const repo = new WooCommerceCatalogRepository('https://shop.test/', store, { fetchImpl });
    const c1 = await repo.getCatalog();
    expect(c1.products).toHaveLength(1);
    online = false;
    expect((await repo.getCatalog()).products[0].id).toBe('woo-87');
  });
  it('throws when offline with no cache (UI shows its error state)', async () => {
    const fetchImpl = (async () => { throw new Error('offline'); }) as unknown as typeof fetch;
    await expect(new WooCommerceCatalogRepository('https://shop.test', mem(), { fetchImpl }).getCatalog()).rejects.toThrow();
  });
});

describe('real twelve12scents.com catalog (fixture exported from the live store)', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const raw = require('./fixtures/twelve12scents.json') as WooProduct[];
  const catalog = groupProducts(raw.map((p) => mapWooProduct(p, [])).filter((p): p is NonNullable<typeof p> => !!p));
  const by = (n: string) => catalog.find((p) => p.name === n)!;

  it('maps all 43 listings and groups the size listings into 37 products', () => { expect(raw).toHaveLength(43); expect(catalog).toHaveLength(37); });
  it('has the 12 tribe products (Ephraim and Manasseh, no Dan or Joseph)', () => {
    const tribes = catalog.filter((p) => p.tribe).map((p) => p.name).sort();
    expect(tribes).toEqual(['Asher', 'Benjamin', 'Ephraim', 'Gad', 'Issachar', 'Judah', 'Levi', 'Manasseh', 'Naphtali', 'Reuben', 'Simeon', 'Zebulun']);
  });
  it('shelves Asher (in both store categories) under the 12 Tribes Collection, not Room Sprays', () => {
    const shelf = (k: 'tribes' | 'spray') => filterProducts(catalog, k, '', 'az').map((p) => p.name);
    expect(shelf('tribes')).toHaveLength(12);
    expect(shelf('tribes')).toContain('Asher');
    expect(shelf('spray')).toEqual(['Black Ice', 'Lavender', 'Linen Cloth', 'Loco Coco Coco', 'Love In Black', 'Luscious Coconut', 'Mahogany Teakwood', 'Sweet Whiskey']);
  });
  it('decodes WordPress entities in names (no raw &#038; in the app)', () => {
    expect(stripHtml('Frank &#038; Myrrh Burning Oil')).toBe('Frank & Myrrh Burning Oil');
    expect(stripHtml('Tabanakin&#8217; &#038; Myrrh Oil')).toBe('Tabanakin’ & Myrrh Oil');
    expect(stripHtml('8&#8243; Brass &amp; &#x2014; &bogus;')).toBe('8″ Brass & — &bogus;');
    expect(catalog.some((p) => /&#?\w+;/.test(p.name) || p.variants.some((v) => /&#?\w+;/.test(v.label)))).toBe(false);
  });
  it('gives stones to the tribes', () => { expect(by('Judah').stone).toBe('Emerald'); expect(by('Ephraim').stone).toBe('Onyx'); expect(by('Manasseh').stone).toBe('Beryl'); expect(by('Asher').stone).toBe('Agate'); expect(by('Naphtali')).toMatchObject({ stone: 'Ligure', colorHex: '#8B1E4B' }); });
  it('swatches: Ephraim solid black, Manasseh dark brown', () => { expect(by('Ephraim')).toMatchObject({ colorHex: '#1A1715', colorHex2: undefined }); expect(by('Manasseh').colorHex).toBe('#4A2C1A'); });
  it('never offers Subscribe & save from the store (no tag)', () => { expect(catalog.some((p) => p.subscribable)).toBe(false); });
  it('turns 11″/19″ incense and frankincense sizes into variants', () => {
    expect(by('11" Incense').variants.map((v) => [v.label, v.price])).toEqual([['100 Sticks', 6], ['5 Pack Bundle', 25]]);
    expect(by('Rock Frankincense').variants.map((v) => v.price)).toEqual([5, 10, 20]);
    expect(by('19" Incense').variants.every((v) => v.inStock === false)).toBe(true);
  });
  it('every product has a price and a photo', () => {
    for (const p of catalog) {
      expect(Math.min(...p.variants.map((v) => v.price))).toBeGreaterThan(0);
      expect(p.images.length).toBeGreaterThan(0);
    }
  });
  it('decodes entities in names/taglines', () => { expect(by('Frank & Myrrh Burning Oil').tagline).toBe('Frankincense & myrrh blend, 2 oz.'); });
});
