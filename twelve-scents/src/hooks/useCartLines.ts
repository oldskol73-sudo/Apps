import { useMemo } from 'react';
import { lineTotal, subtotal, unitPrice } from '@/domain/pricing';
import { CartItem, Product, Variant } from '@/domain/types';
import { useCatalog } from '@/state/catalog';
import { useStore } from '@/state/store';

export interface CartLine { item: CartItem; product: Product; variant: Variant; unit: number; total: number }

/** Joins cart items with catalog data; silently drops items whose product left the catalog. */
export function useCartLines() {
  const { state } = useStore();
  const { byId, threshold, status } = useCatalog();
  return useMemo(() => {
    const lines: CartLine[] = [];
    for (const item of state.cart) {
      const product = byId(item.productId);
      const variant = product?.variants.find((v) => v.id === item.variantId);
      if (product && variant) lines.push({ item, product, variant, unit: unitPrice(variant.price, item.plan), total: lineTotal(variant.price, item.qty, item.plan) });
    }
    const sub = subtotal(lines.map((l) => ({ price: l.variant.price, qty: l.item.qty, plan: l.item.plan })));
    return { lines, sub, threshold, status, hydrated: state.hydrated };
  }, [state.cart, state.hydrated, byId, threshold, status]);
}
