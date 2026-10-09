import * as WebBrowser from 'expo-web-browser';
import { colors } from '@/theme';

export { checkoutLinkUrl } from '@/domain/checkoutLink';

/** Set when the store's thank-you page sends the shopper back (app/order-complete.tsx); null while checkout is open. */
let completedOrder: string | null = null;

/**
 * Opens the checkout in an in-app Safari sheet (supports Apple Pay and PayPal). Resolves when the sheet closes,
 * with the order number if the store sent the shopper back after placing the order, otherwise null.
 */
export async function openWebCheckout(url: string): Promise<{ order: string } | null> {
  completedOrder = null;
  await WebBrowser.openBrowserAsync(url, {
    controlsColor: colors.brassText,
    dismissButtonStyle: 'done',
    enableBarCollapsing: true,
  });
  const order = completedOrder;
  completedOrder = null;
  return order === null ? null : { order };
}

/** Called from the twelvescents://order-complete deep link: records the order and closes the checkout sheet. */
export function markWebOrderComplete(order: string) {
  completedOrder = order;
  try { WebBrowser.dismissBrowser(); } catch { /* not presented (e.g. cold start from the link) */ }
}
