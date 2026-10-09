import { checkoutLinkUrl } from '../src/domain/checkoutLink';

describe('website checkout link', () => {
  it('builds a WooCommerce checkout link from the bag', () => {
    expect(checkoutLinkUrl('https://twelve12scents.com/', [{ variantId: '87', qty: 2 }, { variantId: '85', qty: 1 }]))
      .toBe('https://twelve12scents.com/checkout-link/?products=87:2,85:1&ts_app=1');
  });
  it('merges the same product (e.g. one-time and subscription lines)', () => {
    expect(checkoutLinkUrl('https://s.test', [{ variantId: '87', qty: 1 }, { variantId: '87', qty: 2 }])).toBe('https://s.test/checkout-link/?products=87:3&ts_app=1');
  });
  it('skips non-store ids and empty quantities, and returns null when nothing is left', () => {
    expect(checkoutLinkUrl('https://s.test', [{ variantId: 'spray-levi-100', qty: 1 }, { variantId: '9', qty: 0 }])).toBeNull();
  });
});
