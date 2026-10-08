import { ShippingMethod } from './types';

export interface ShippingZone {
  name: string;
  states: string[];
  flatRate: { title: string; cost: number };
  /** Local pickup is only offered in some zones. */
  localPickup: boolean;
}

/**
 * Mirrors the store's WooCommerce shipping zones (flat rate by destination state, plus local pickup in the East Coast
 * zone). The Store API does not expose zone settings publicly, so keep this in sync with WooCommerce → Shipping,
 * or override it from the hosted catalog JSON (`shipping.zones`).
 */
export const DEFAULT_ZONES: ShippingZone[] = [
  { name: 'East Coast US', flatRate: { title: 'Flat rate · 1–3 business days', cost: 12.99 }, localPickup: true,
    states: ['ME', 'NH', 'VT', 'MA', 'RI', 'CT', 'NY', 'NJ', 'PA', 'DE', 'MD', 'DC', 'VA', 'WV', 'NC', 'SC', 'GA', 'FL'] },
  { name: 'Southern States', flatRate: { title: 'Flat rate · 2–3 business days', cost: 15.99 }, localPickup: false,
    states: ['AL', 'MS', 'LA', 'AR', 'TN', 'KY', 'TX', 'OK'] },
  { name: 'Midwest & Western US', flatRate: { title: 'Flat rate · 3–5 business days', cost: 19.99 }, localPickup: false,
    states: ['OH', 'IN', 'IL', 'MI', 'WI', 'MN', 'IA', 'MO', 'ND', 'SD', 'NE', 'KS', 'MT', 'WY', 'CO', 'NM', 'AZ', 'UT', 'NV', 'ID', 'WA', 'OR', 'CA', 'AK', 'HI'] },
];

export interface ShippingOption { method: ShippingMethod; title: string; cost: number }

export const normaliseState = (region: string) => region.trim().toUpperCase();
export const zoneFor = (region: string, zones: ShippingZone[] = DEFAULT_ZONES) =>
  zones.find((z) => z.states.includes(normaliseState(region)));

/** Options available for a destination state. Empty array = we don't ship there. */
export function shippingOptions(region: string, zones: ShippingZone[] = DEFAULT_ZONES): ShippingOption[] {
  const z = zoneFor(region, zones);
  if (!z) return [];
  const out: ShippingOption[] = [{ method: 'flat_rate', title: z.flatRate.title, cost: z.flatRate.cost }];
  if (z.localPickup) out.push({ method: 'local_pickup', title: 'Local pickup', cost: 0 });
  return out;
}
/** Cost of a chosen method; falls back to the first available option if the method isn't offered for this state. */
export function shippingCost(method: ShippingMethod, region: string, zones: ShippingZone[] = DEFAULT_ZONES): number {
  const opts = shippingOptions(region, zones);
  return (opts.find((o) => o.method === method) ?? opts[0])?.cost ?? 0;
}
