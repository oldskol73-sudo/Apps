import Constants from 'expo-constants';
import { MockCatalogRepository } from './mockCatalogRepository';
import { RemoteCatalogRepository } from './remoteCatalogRepository';
import { CatalogRepository } from './repository';

const extra = (Constants.expoConfig?.extra ?? {}) as { apiBaseUrl?: string; stripePublishableKey?: string; freeShippingThreshold?: number };
export const config = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || extra.apiBaseUrl || '',
  stripeKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || extra.stripePublishableKey || '',
  freeShippingThreshold: Number(process.env.EXPO_PUBLIC_FREE_SHIPPING_THRESHOLD || extra.freeShippingThreshold || 60),
};
const mock = new MockCatalogRepository();
export const catalogRepository: CatalogRepository = config.apiBaseUrl ? new RemoteCatalogRepository(config.apiBaseUrl, mock) : mock;
