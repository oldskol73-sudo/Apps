import { Address } from '@/domain/types';

export interface PaymentRequest { amount: number; currency: 'usd'; method: 'apple_pay' | 'google_pay' | 'card'; shipTo: Address; recurring: boolean }
export interface PaymentResult { ok: boolean; reference?: string; error?: string }

/**
 * Physical goods: Stripe Payment Sheet (Apple Pay / Google Pay), never IAP.
 * Real impl: POST {apiBase}/payments/intent -> clientSecret, then initPaymentSheet + presentPaymentSheet
 * from @stripe/stripe-react-native (needs a dev build, not Expo Go). Recurring items map to Stripe Subscriptions server-side.
 */
export interface PaymentService { pay(req: PaymentRequest): Promise<PaymentResult> }

export class MockPaymentService implements PaymentService {
  async pay(req: PaymentRequest): Promise<PaymentResult> {
    await new Promise((r) => setTimeout(r, 900));
    if (req.amount < 0) return { ok: false, error: 'Invalid amount' };
    return { ok: true, reference: `pi_mock_${Date.now()}` };
  }
}
export const paymentService: PaymentService = new MockPaymentService();
