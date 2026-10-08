import { Product } from '@/domain/types';
import { ShippingZone } from '@/domain/shipping';

export interface Catalog { version: number; /** Optional override of the built-in shipping zones. */ shipping?: { zones: ShippingZone[] }; products: Product[] }

/** Catalog source. Swap Mock -> Remote -> Shopify without touching UI. */
export interface CatalogRepository { getCatalog(): Promise<Catalog> }

/** Key/value persistence for cart, favourites, orders (local now; sync layer when signed in). */
export interface LocalStore {
  read<T>(key: string): Promise<T | null>;
  write<T>(key: string, value: T): Promise<void>;
}
