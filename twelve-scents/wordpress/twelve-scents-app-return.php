<?php
/**
 * Plugin Name: Twelve Scents App Return
 * Description: Sends shoppers who check out from the Twelve Scents iPhone app back to the app from the order-received (thank-you) page. Website shoppers are not affected.
 * Version: 1.0.0
 * Requires Plugins: woocommerce
 *
 * How it works
 * 1. The app opens /checkout-link/?products=…&ts_app=1 in an in-app Safari sheet (which has its own cookies,
 *    separate from the phone's Safari). This plugin remembers that with a short-lived cookie.
 * 2. When that browser reaches the order-received page for a real order, the page shows a "Return to the app"
 *    bar and opens twelvescents://order-complete?order=<number>. The app closes the sheet, clears the bag and
 *    shows the confirmation.
 */

defined( 'ABSPATH' ) || exit;

const TS_APP_RETURN_COOKIE = 'ts_app_checkout';
const TS_APP_RETURN_URL    = 'twelvescents://order-complete';

/** 1. Remember checkouts started from the app. Runs early so it is set on the checkout-link redirect itself. */
add_action( 'plugins_loaded', function () {
	if ( ! isset( $_GET['ts_app'] ) || '1' !== $_GET['ts_app'] || headers_sent() ) {
		return;
	}
	setcookie( TS_APP_RETURN_COOKIE, '1', array(
		'expires'  => time() + DAY_IN_SECONDS,
		'path'     => '/',
		'secure'   => is_ssl(),
		'httponly' => true,
		'samesite' => 'Lax',
	) );
	$_COOKIE[ TS_APP_RETURN_COOKIE ] = '1';
}, 1 );

/** 2. On the order-received page of an app checkout, hand the shopper back to the app. */
add_action( 'template_redirect', function () {
	if ( empty( $_COOKIE[ TS_APP_RETURN_COOKIE ] ) || ! function_exists( 'is_order_received_page' ) || ! is_order_received_page() ) {
		return;
	}
	$order_id = absint( get_query_var( 'order-received' ) );
	$order    = $order_id ? wc_get_order( $order_id ) : false;
	$key      = isset( $_GET['key'] ) ? wc_clean( wp_unslash( $_GET['key'] ) ) : '';
	// Only for the shopper's own, real order (valid key) that didn't fail; a failed payment page offers "pay again" instead.
	if ( ! $order || ! $key || ! hash_equals( $order->get_order_key(), $key ) || $order->has_status( array( 'failed', 'cancelled' ) ) ) {
		return;
	}

	// One-shot: later visits to the site in this browser behave normally.
	if ( ! headers_sent() ) {
		setcookie( TS_APP_RETURN_COOKIE, '', time() - HOUR_IN_SECONDS, '/' );
	}

	$url = add_query_arg( 'order', rawurlencode( $order->get_order_number() ), TS_APP_RETURN_URL );

	add_action( 'wp_footer', function () use ( $url, $order ) {
		?>
		<div id="ts-app-return" role="region" aria-label="<?php esc_attr_e( 'Return to the app', 'twelve-scents' ); ?>">
			<span><?php printf( esc_html__( 'Order #%s placed. Thank you!', 'twelve-scents' ), esc_html( $order->get_order_number() ) ); ?></span>
			<a href="<?php echo esc_url( $url, array( 'twelvescents' ) ); ?>"><?php esc_html_e( 'Return to the app', 'twelve-scents' ); ?></a>
		</div>
		<style>
			#ts-app-return{position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:99999;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 12px 12px 18px;border-radius:999px;background:#2A211B;color:#F4EEE5;font:500 15px/1.3 -apple-system,BlinkMacSystemFont,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.25)}
			#ts-app-return a{flex-shrink:0;padding:10px 16px;border-radius:999px;background:linear-gradient(#E6C46E,#C99A3F);color:#2A1D10;text-decoration:none;font-weight:600}
		</style>
		<script>
			// Give the shopper a moment to see the confirmation, then return to the app (iOS asks to open it).
			setTimeout(function () { window.location.href = <?php echo wp_json_encode( $url ); ?>; }, 1500);
		</script>
		<?php
	} );
} );
