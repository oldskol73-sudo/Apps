import { Catalog, CatalogRepository, LocalStore } from './repository';
import { DEFAULT_MAPPING, mapWooProduct, WooMapping, WooProduct, WooVariation } from './wooMapping';

const CACHE_KEY = 'ts.catalog.woo.v1';

/**
 * Reads the public WooCommerce Store API: {siteUrl}/wp-json/wc/store/v1. No consumer key/secret is needed or used
 * (never embed those in an app binary). On success the catalog is cached; if the network fails the last good
 * catalog is served, otherwise the error propagates so the UI shows its error state (we never fall back to mock
 * prices for a live store).
 */
export class WooCommerceCatalogRepository implements CatalogRepository {
  constructor(
    private siteUrl: string,
    private store: LocalStore,
    private opts: { freeShippingThreshold: number; mapping?: WooMapping; fetchImpl?: typeof fetch } = { freeShippingThreshold: 60 },
  ) {}

  private get base() { return `${this.siteUrl.replace(/\/$/, '')}/wp-json/wc/store/v1`; }
  private async get<T>(path: string): Promise<{ data: T; totalPages: number }> {
    const f = this.opts.fetchImpl ?? fetch;
    const res = await f(`${this.base}${path}`, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`WooCommerce ${res.status} for ${path}`);
    return { data: (await res.json()) as T, totalPages: Number(res.headers.get('X-WP-TotalPages') ?? 1) };
  }

  private async allProducts(): Promise<WooProduct[]> {
    const out: WooProduct[] = [];
    for (let page = 1; page <= 10; page++) { // hard cap: 1000 products
      const { data, totalPages } = await this.get<WooProduct[]>(`/products?per_page=100&page=${page}&orderby=menu_order&order=asc`);
      out.push(...data);
      if (page >= totalPages) break;
    }
    return out;
  }

  private async variations(p: WooProduct): Promise<WooVariation[]> {
    if (p.type !== 'variable') return [];
    try {
      return (await this.get<WooVariation[]>(`/products?type=variation&parent=${p.id}&per_page=100`)).data;
    } catch { return []; } // falls back to the product's min price as a single variant
  }

  async getCatalog(): Promise<Catalog> {
    try {
      const raw = await this.allProducts();
      const mapping = this.opts.mapping ?? DEFAULT_MAPPING;
      const mapped = await Promise.all(raw.map(async (p) => mapWooProduct(p, await this.variations(p), mapping)));
      const products = mapped.filter((p): p is NonNullable<typeof p> => !!p);
      if (products.length === 0) throw new Error('WooCommerce returned no mappable products');
      const catalog: Catalog = { version: 1, freeShippingThreshold: this.opts.freeShippingThreshold, products };
      await this.store.write(CACHE_KEY, catalog);
      return catalog;
    } catch (e) {
      const cached = await this.store.read<Catalog>(CACHE_KEY);
      if (cached) return cached;
      throw e;
    }
  }
}
