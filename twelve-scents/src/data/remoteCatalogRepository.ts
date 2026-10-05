import { Catalog, CatalogRepository } from './repository';

/**
 * REST catalog: GET {baseUrl}/catalog.json -> Catalog. Lets names/prices/sizes change without a release.
 * Falls back to the bundled copy when offline so the app always opens.
 */
export class RemoteCatalogRepository implements CatalogRepository {
  constructor(private baseUrl: string, private fallback: CatalogRepository) {}
  async getCatalog(): Promise<Catalog> {
    try {
      const res = await fetch(`${this.baseUrl.replace(/\/$/, '')}/catalog.json`);
      if (!res.ok) throw new Error(`Catalog HTTP ${res.status}`);
      const json = (await res.json()) as Catalog;
      if (!Array.isArray(json.products) || json.products.length === 0) throw new Error('Empty catalog');
      return json;
    } catch {
      return this.fallback.getCatalog();
    }
  }
}
// A ShopifyCatalogRepository (Storefront API GraphQL -> Product mapping) implements the same interface.
