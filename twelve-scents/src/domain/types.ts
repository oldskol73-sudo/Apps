export type Category = 'spray' | 'incense' | 'rock' | 'oil' | 'censer' | 'charcoal';
export type Character = 'Warm' | 'Fresh' | 'Grounding' | 'Bright';
export type Plan = 'once' | 'subscription';

export interface Variant { id: string; label: string; price: number; /** false = sold out (undefined means available) */ inStock?: boolean }
export interface Product {
  id: string;
  category: Category;
  name: string;
  stone?: string;
  numeral?: string;
  colorHex: string;
  /** Part of the Twelve Tribes collection (drives the stone grid). Undefined is treated as true for stone-bearing sprays. */
  tribe?: boolean;
  character: Character;
  tagline: string;
  description: string;
  details: { label: string; value: string }[];
  variants: Variant[];
  subscribable: boolean;
  pairings: string[];
  images: string[];
}
export interface CartItem { productId: string; variantId: string; qty: number; plan: Plan }
export interface Subscription {
  id: string; productId: string; variantId: string; intervalWeeks: number; nextDate: string; skipped: boolean;
}
export interface OrderItem { productId: string; variantId: string; qty: number; plan: Plan; unitPrice: number }
export interface Order { id: string; date: string; items: OrderItem[]; total: number; pointsEarned: number }
export interface Address { name: string; line1: string; city: string; region: string; postcode: string }
export interface User {
  name: string; address: Address; points: number; tier: string; favourites: string[];
}
export type Mood = 'Clean' | 'Earthy' | 'Warm' | 'Fresh' | 'Rich';
export type ShippingMethod = 'standard' | 'express';
