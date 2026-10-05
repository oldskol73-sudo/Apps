export type Category = 'spray' | 'incense' | 'rock' | 'oil' | 'censer' | 'charcoal';
export type Character = 'Warm' | 'Fresh' | 'Grounding' | 'Bright';
export type Plan = 'once' | 'subscription';

export interface Variant { id: string; label: string; price: number }
export interface Product {
  id: string;
  category: Category;
  name: string;
  stone?: string;
  numeral?: string;
  colorHex: string;
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
