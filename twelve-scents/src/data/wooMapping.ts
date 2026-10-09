import { Category, Character, Product, Variant } from '@/domain/types';

/** Subset of the WooCommerce Store API (/wp-json/wc/store/v1/products) product shape that we read. */
export interface WooAttributeTerm { id?: number; name: string; slug?: string }
export interface WooAttribute { id?: number; name: string; taxonomy?: string; has_variations?: boolean; terms?: WooAttributeTerm[] }
export interface WooProduct {
  id: number; name: string; type?: string; slug?: string; is_in_stock?: boolean;
  short_description?: string; description?: string;
  prices?: { price?: string; currency_minor_unit?: number; price_range?: { min_amount: string } | null };
  images?: { src: string }[];
  categories?: { slug: string; name?: string }[];
  tags?: { slug: string; name?: string }[];
  attributes?: WooAttribute[];
  variations?: { id: number; attributes?: { name: string; value: string }[] }[];
  cross_sell_ids?: number[]; upsell_ids?: number[]; related_ids?: number[];
}
export interface WooVariation { id: number; is_in_stock?: boolean; prices?: WooProduct['prices']; attributes?: { name: string; value: string }[] }

export interface WooMapping {
  /** Woo category slug -> app category. First matching category on the product wins. */
  categorySlugs: Record<string, Category>;
  /** Category slug that marks the Twelve Tribes collection. */
  tribeSlug: string;
  /** Tag slug that marks a product as available for "Subscribe & save" (needs a subscriptions plugin server-side). */
  subscribeTag: string;
  attr: { stone: string; numeral: string; character: string; colour: string; hidden: string[] };
}
/** Matches twelve12scents.com as inspected (7 categories, simple products, no attributes/tags). */
export const DEFAULT_MAPPING: WooMapping = {
  categorySlugs: {
    'twelve-tribes-collection': 'spray', 'room-car-fresheners': 'spray',
    incense: 'incense', 'rock-frankincense': 'rock', 'burning-oils': 'oil',
    'holders-burners': 'censer', charcoal: 'charcoal',
  },
  tribeSlug: 'twelve-tribes-collection',
  subscribeTag: 'subscribe',
  attr: { stone: 'stone', numeral: 'numeral', character: 'character', colour: 'colour', hidden: ['stone', 'numeral', 'character', 'colour', 'color'] },
};

/** Breastplate stone, numeral and colour per tribe name (brand spec). Ephraim and Manasseh have a stone but no numeral. */
export const TRIBES: Record<string, { stone?: string; numeral?: string; colour: string; band?: string }> = {
  reuben: { stone: 'Sardius', numeral: 'I', colour: '#8E2B25' }, simeon: { stone: 'Topaz', numeral: 'II', colour: '#B0822C' },
  levi: { stone: 'Carbuncle', numeral: 'III', colour: '#6E1F35' }, judah: { stone: 'Emerald', numeral: 'IV', colour: '#2F6E4A' },
  issachar: { stone: 'Sapphire', numeral: 'V', colour: '#27447A' }, zebulun: { stone: 'Diamond', numeral: 'VI', colour: '#7F8C8F' },
  dan: { stone: 'Ligure', numeral: 'VII', colour: '#A0522D' }, naphtali: { stone: 'Ligure', numeral: 'VIII', colour: '#8B1E4B' },
  gad: { stone: 'Amethyst', numeral: 'IX', colour: '#5B3A7A' }, asher: { stone: 'Agate', numeral: 'X', colour: '#8A6A2F' },
  joseph: { stone: 'Onyx', numeral: 'XI', colour: '#3A3430' }, benjamin: { stone: 'Jasper', numeral: 'XII', colour: '#8C3D2E' },
  // Not on the breastplate list: Joseph's sons. Swatches per the brand: solid black onyx, and dark brown.
  ephraim: { stone: 'Onyx', colour: '#1A1715' }, manasseh: { stone: 'Beryl', colour: '#4A2C1A' },
};
const BRASS = '#C99A3F';
const CHARACTERS: Character[] = ['Warm', 'Fresh', 'Grounding', 'Bright'];
/** The store has no "character" field, so infer it from its own copy. First hit wins; default Warm. */
const CHARACTER_HINTS: [Character, RegExp][] = [
  ['Grounding', /earth|wood|teak|mahogany|oud|musk|ground|tobacco|leather|myrrh|smoke|black|whisk/i],
  ['Fresh', /fresh|green|mint|linen|ocean|rain|crisp|airy|coconut|lavender|herbal/i],
  ['Bright', /clean|bright|citrus|light|ice|elevated|clear|sparkl/i],
  ['Warm', /warm|rich|abundan|spice|amber|sweet|vanilla|luxur|frankincense/i],
];
export function inferCharacter(text: string): Character {
  return CHARACTER_HINTS.find(([, re]) => re.test(text))?.[0] ?? 'Warm';
}

const NAMED: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', hellip: '…', prime: '′', Prime: '″', reg: '®', trade: '™', copy: '©' };
/** WordPress encodes names and copy ("Frank &#038; Myrrh", 8&#8243;): decode numeric (decimal/hex) and common named entities. */
function decodeEntity(m: string, body: string): string {
  const code = body[0] !== '#' ? NaN : body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
  if (!Number.isNaN(code)) return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
  return NAMED[body] ?? m;
}
export function stripHtml(html = ''): string {
  return html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>\s*<p>/gi, '\n\n').replace(/<[^>]+>/g, '')
    .replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, decodeEntity).replace(/\n{3,}/g, '\n\n').trim();
}
/** Woo money: minor-unit integer string -> dollars. "3500" with minor unit 2 -> 35. */
export function wooPrice(prices: WooProduct['prices'] | undefined, useRangeMin = false): number {
  if (!prices) return 0;
  const raw = (useRangeMin && prices.price_range?.min_amount) || prices.price || '0';
  const minor = prices.currency_minor_unit ?? 2;
  return Math.round((Number(raw) / 10 ** minor) * 100) / 100;
}

const attrTerm = (p: WooProduct, name: string) =>
  p.attributes?.find((a) => a.name.toLowerCase() === name.toLowerCase())?.terms?.[0]?.name;

export function mapCategory(p: WooProduct, m: WooMapping): Category | null {
  for (const c of p.categories ?? []) { const hit = m.categorySlugs[c.slug]; if (hit) return hit; }
  return null;
}

/** Splits "11″ Incense — 100 Sticks" into the product family and the size/variant label. */
export function splitName(name: string): { base: string; label: string | null } {
  const i = name.indexOf(' — ');
  return i > 0 ? { base: name.slice(0, i).trim(), label: name.slice(i + 3).trim() } : { base: name.trim(), label: null };
}

/** Maps one Woo product (+ fetched variations if variable) to an app Product, or null if it can't be shown/bought. */
export function mapWooProduct(p: WooProduct, variations: WooVariation[], m: WooMapping = DEFAULT_MAPPING): Product | null {
  const category = mapCategory(p, m);
  if (!category) return null;
  const name = stripHtml(p.name);
  const { base, label } = splitName(name);
  const tribeInfo = TRIBES[base.toLowerCase()];
  const isTribe = !!p.categories?.some((c) => c.slug === m.tribeSlug);

  const stone = attrTerm(p, m.attr.stone) ?? (isTribe ? tribeInfo?.stone : undefined);
  const numeral = attrTerm(p, m.attr.numeral) ?? (isTribe ? tribeInfo?.numeral : undefined);
  const colourAttr = attrTerm(p, m.attr.colour);
  const colorHex = /^#[0-9a-f]{6}$/i.test(colourAttr ?? '') ? colourAttr! : (isTribe && tribeInfo?.colour) || BRASS;
  const short = stripHtml(p.short_description);
  const description = stripHtml(p.description) || short;
  const charRaw = attrTerm(p, m.attr.character) ?? '';
  const character = CHARACTERS.find((c) => c.toLowerCase() === charRaw.toLowerCase()) ?? inferCharacter(`${short} ${description}`);

  const details = (p.attributes ?? [])
    .filter((a) => !a.has_variations && !m.attr.hidden.includes(a.name.toLowerCase()) && a.terms?.length)
    .slice(0, 3).map((a) => ({ label: a.name, value: a.terms!.map((t) => t.name).join(', ') }));

  let variants: Variant[];
  if (p.type === 'variable' && variations.length) {
    variants = variations.map((v) => ({
      id: String(v.id), label: (v.attributes ?? []).map((a) => a.value).filter(Boolean).join(' · ') || name,
      price: wooPrice(v.prices), inStock: v.is_in_stock !== false,
    }));
  } else {
    variants = [{ id: String(p.id), label: label ?? 'Standard', price: wooPrice(p.prices, p.type === 'variable'), inStock: p.is_in_stock !== false }];
  }
  if (variants.every((v) => v.price <= 0)) return null;

  return {
    id: `woo-${p.id}`, category, name: base, stone, numeral, colorHex, colorHex2: isTribe ? tribeInfo?.band : undefined, tribe: isTribe, character,
    tagline: short.split('\n')[0] ?? '', description, details, variants,
    subscribable: !!p.tags?.some((t) => t.slug === m.subscribeTag),
    pairings: [...(p.cross_sell_ids ?? []), ...(p.upsell_ids ?? []), ...(p.related_ids ?? [])].slice(0, 4).map((i) => `woo-${i}`),
    images: (p.images ?? []).map((i) => i.src),
  };
}

/**
 * The store lists each size as its own simple product ("11″ Incense — 100 Sticks", "… — 5 Pack Bundle").
 * Merge those into one app product with several variants (the Type dropdown). The first listing's copy/images win.
 */
export function groupProducts(products: Product[]): Product[] {
  const out: Product[] = [];
  const byKey = new Map<string, Product>();
  for (const p of products) {
    const hasSize = p.variants[0].label !== 'Standard';
    const key = `${p.category}|${p.name}`;
    const existing = hasSize ? byKey.get(key) : undefined;
    if (existing) {
      existing.variants.push(...p.variants);
      if (!existing.description) existing.description = p.description;
      if (!existing.tagline) existing.tagline = p.tagline;
      if (existing.images.length === 0) existing.images = p.images;
    } else {
      const copy = { ...p, variants: [...p.variants] };
      out.push(copy);
      if (hasSize) byKey.set(key, copy);
    }
  }
  return out;
}
