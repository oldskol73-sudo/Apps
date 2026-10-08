import { Category, Character, Product, Variant } from '@/domain/types';

/** Subset of the WooCommerce Store API (/wp-json/wc/store/v1/products) product shape that we read. */
export interface WooAttributeTerm { id?: number; name: string; slug?: string }
export interface WooAttribute { id?: number; name: string; taxonomy?: string; has_variations?: boolean; terms?: WooAttributeTerm[] }
export interface WooProduct {
  id: number; name: string; type?: string; slug?: string;
  short_description?: string; description?: string;
  prices?: { price?: string; currency_minor_unit?: number; price_range?: { min_amount: string } | null };
  images?: { src: string }[];
  categories?: { slug: string; name?: string }[];
  tags?: { slug: string; name?: string }[];
  attributes?: WooAttribute[];
  variations?: { id: number; attributes?: { name: string; value: string }[] }[];
  cross_sell_ids?: number[]; upsell_ids?: number[]; related_ids?: number[];
}
export interface WooVariation { id: number; prices?: WooProduct['prices']; attributes?: { name: string; value: string }[] }

/** Everything shop-specific lives here so the Woo store can be tuned without code changes. */
export interface WooMapping {
  /** Woo category slug -> app category. First match wins. */
  categorySlugs: Record<string, Category>;
  /** Tag slug that marks a product as available for "Subscribe & save". */
  subscribeTag: string;
  /** Attribute names (case-insensitive) that carry app fields. */
  attr: { stone: string; numeral: string; character: string; colour: string; hidden: string[] };
}
export const DEFAULT_MAPPING: WooMapping = {
  categorySlugs: {
    'room-sprays': 'spray', 'room-spray': 'spray', sprays: 'spray',
    incense: 'incense', 'hand-rolled-incense': 'incense',
    'rock-incense': 'rock', resins: 'rock', resin: 'rock',
    'burning-oils': 'oil', oils: 'oil',
    'brass-censers': 'censer', censers: 'censer',
    charcoal: 'charcoal',
  },
  subscribeTag: 'subscribe',
  attr: { stone: 'stone', numeral: 'numeral', character: 'character', colour: 'colour', hidden: ['stone', 'numeral', 'character', 'colour', 'color'] },
};

/** Breastplate colours from the brand spec, used when a Woo product has no "Colour" attribute. */
export const STONE_COLOURS: Record<string, string> = {
  sardius: '#8E2B25', topaz: '#B0822C', carbuncle: '#6E1F35', emerald: '#2F6E4A', sapphire: '#27447A', diamond: '#7F8C8F',
  ligure: '#A0522D', agate: '#5F7A63', amethyst: '#5B3A7A', beryl: '#8A6A2F', onyx: '#3A3430', jasper: '#8C3D2E',
};
const BRASS = '#C99A3F';
const CHARACTERS: Character[] = ['Warm', 'Fresh', 'Grounding', 'Bright'];

const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#039;': "'", '&#8217;': '’', '&#8211;': '–', '&#8212;': '—', '&nbsp;': ' ' };
export function stripHtml(html = ''): string {
  return html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>\s*<p>/gi, '\n\n').replace(/<[^>]+>/g, '')
    .replace(/&(#\d+|[a-z]+);/gi, (m) => ENTITIES[m] ?? m).replace(/\n{3,}/g, '\n\n').trim();
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

/** Maps one Woo product (+ its fetched variations, if variable) to an app Product. Returns null when it can't be shown. */
export function mapWooProduct(p: WooProduct, variations: WooVariation[], m: WooMapping = DEFAULT_MAPPING): Product | null {
  const category = mapCategory(p, m);
  if (!category) return null; // uncategorised/unknown products are not part of the app catalog

  const stone = attrTerm(p, m.attr.stone);
  const charRaw = attrTerm(p, m.attr.character) ?? '';
  const character = CHARACTERS.find((c) => c.toLowerCase() === charRaw.toLowerCase()) ?? 'Warm';
  const colourAttr = attrTerm(p, m.attr.colour);
  const colorHex = /^#[0-9a-f]{6}$/i.test(colourAttr ?? '') ? colourAttr! : (stone && STONE_COLOURS[stone.toLowerCase()]) || BRASS;

  const details = (p.attributes ?? [])
    .filter((a) => !a.has_variations && !m.attr.hidden.includes(a.name.toLowerCase()) && a.terms?.length)
    .slice(0, 3).map((a) => ({ label: a.name, value: a.terms!.map((t) => t.name).join(', ') }));

  let variants: Variant[];
  if (p.type === 'variable' && variations.length) {
    variants = variations.map((v) => ({
      id: String(v.id),
      label: (v.attributes ?? []).map((a) => a.value).filter(Boolean).join(' · ') || p.name,
      price: wooPrice(v.prices),
    }));
  } else {
    variants = [{ id: String(p.id), label: p.type === 'variable' ? p.name : 'Standard', price: wooPrice(p.prices, p.type === 'variable') }];
  }
  if (variants.every((v) => v.price <= 0)) return null; // unpriced products can't be bought

  return {
    id: `woo-${p.id}`, category, name: stripHtml(p.name), stone, numeral: attrTerm(p, m.attr.numeral), colorHex, character,
    tagline: stripHtml(p.short_description).split('\n')[0] ?? '',
    description: stripHtml(p.description) || stripHtml(p.short_description),
    details, variants,
    subscribable: !!p.tags?.some((t) => t.slug === m.subscribeTag),
    pairings: [...(p.cross_sell_ids ?? []), ...(p.upsell_ids ?? []), ...(p.related_ids ?? [])].slice(0, 4).map((i) => `woo-${i}`),
    images: (p.images ?? []).map((i) => i.src),
  };
}
