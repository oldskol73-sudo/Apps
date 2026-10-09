export interface CheckoutLine { variantId: string; qty: number }

/**
 * WooCommerce shareable checkout link (WooCommerce 9.9+): `/checkout-link/?products=ID:QTY,ID:QTY`
 * fills a fresh store cart and redirects to the web checkout, where the store handles address, shipping
 * zones, coupons and payment (WooPayments with Apple Pay, PayPal). Woo variant ids are the store's product ids.
 * `ts_app=1` tells the store's Twelve Scents App Return plugin (wordpress/) that this checkout came from the app,
 * so its order-received page sends the shopper back via `twelvescents://order-complete?order=<number>`.
 * Returns null when nothing in the bag maps to a store product (e.g. running on the mock catalog).
 */
export function checkoutLinkUrl(siteUrl: string, lines: CheckoutLine[]): string | null {
  const qty = new Map<string, number>();
  for (const l of lines) {
    if (!/^\d+$/.test(l.variantId) || l.qty < 1) continue;
    qty.set(l.variantId, (qty.get(l.variantId) ?? 0) + Math.floor(l.qty));
  }
  if (!qty.size) return null;
  const products = [...qty].map(([id, n]) => `${id}:${n}`).join(',');
  return `${siteUrl.replace(/\/+$/, '')}/checkout-link/?products=${products}&ts_app=1`;
}
