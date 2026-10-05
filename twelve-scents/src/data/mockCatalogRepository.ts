import raw from './catalog.json';
import { Catalog, CatalogRepository } from './repository';

export class MockCatalogRepository implements CatalogRepository {
  constructor(private delayMs = 350) {}
  async getCatalog(): Promise<Catalog> {
    await new Promise((r) => setTimeout(r, this.delayMs));
    return raw as unknown as Catalog;
  }
}
