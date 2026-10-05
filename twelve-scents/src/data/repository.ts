import { Product } from '@/domain/types';

export interface Catalog { version: number; freeShippingThreshold: number; products: Product[] }

/** Catalog source. Swap Mock -> Remote -> Shopify without touching UI. */
export interface CatalogRepository { getCatalog(): Promise<Catalog> }

/** Key/value persistence for cart, favourites, orders (local now; sync layer when signed in). */
export interface LocalStore {
  read<T>(key: string): Promise<T | null>;
  write<T>(key: string, value: T): Promise<void>;
}
