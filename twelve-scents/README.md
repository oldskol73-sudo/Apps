# Twelve Scents

Expo (React Native + TypeScript, expo-router) shopping app for Twelve Scents: room sprays, incense, resins, oils, charcoal and brass censers, organised around the 12 tribes.

## Setup
```bash
cd twelve-scents
npm install
npm start          # then press i (iOS sim), a (Android emulator) or w (web)
npm run typecheck  # tsc --noEmit
npm test           # unit tests (cart math, shipping zones, points, subscription discount, finder ranking, search, WooCommerce mapping)
```
The app runs fully on mock data with no keys. Fonts (Bodoni Moda, Jost; OFL) are bundled via `@expo-google-fonts/*`.

## Environment
Copy `.env.example` to `.env` (all `EXPO_PUBLIC_*`, read in `src/data/index.ts`):

| Key | Purpose |
|---|---|
| `EXPO_PUBLIC_WOO_URL` | WooCommerce site root, e.g. `https://yourstore.com`. Enables the live catalog via the public Store API (no keys). Takes priority over the options below |
| `EXPO_PUBLIC_API_BASE_URL` | If set, catalog is fetched from `{url}/catalog.json` (falls back to the bundled copy when offline) |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key for the Payment Sheet |
| `EXPO_PUBLIC_FEATURE_SUBSCRIPTIONS` | `true` to show Subscribe & save and the Account deliveries section. Default `false` (dark) until a subscriptions backend exists |

## Architecture
- `src/theme` – every colour/type/shape token. Views import tokens; no hard-coded colours.
- `src/domain` – pure logic (`pricing.ts`: cart, shipping, points, tiers, finder ranking, search/sort). Unit-tested in `__tests__`.
- `src/data` – `CatalogRepository` interface; `MockCatalogRepository` (bundled `catalog.json`), `RemoteCatalogRepository` (REST). `WooCommerceCatalogRepository` reads `/wp-json/wc/store/v1/products` (+ variations), caches the last good catalog for offline use, and shows the error state rather than mock prices if there is neither network nor cache.
- `src/services` – `analytics` (view_item, add_to_cart, begin_checkout, purchase, finder_complete, subscribe), `payments`, `auth`, `notifications`. These are **interfaces with mock implementations** (see below).
- `src/state` – store (cart, favourites, user, subscriptions, orders; persisted to AsyncStorage) and catalog provider (loading/ready/error).
- `app/` – routes: `(tabs)` Shop · Browse · Finder · Bag · Account; pushed `product/[id]`, `checkout`, `confirmed`. Search is the header magnifier → Browse with the search field open.

### WooCommerce (twelve12scents.com)
`EXPO_PUBLIC_WOO_URL=https://twelve12scents.com` switches the app to the live catalog (public Store API, no keys). The mapping in `src/data/wooMapping.ts` was written against the store as inspected (43 simple products, 7 categories, no attributes/tags):

| Woo category slug | App |
|---|---|
| `twelve-tribes-collection` | Room spray, flagged `tribe` (drives the Shop stone grid) |
| `room-car-fresheners` | Room spray (not in the stone grid) |
| `incense` · `rock-frankincense` · `burning-oils` · `charcoal` | Incense · Rock Incense · Burning Oils · Charcoal |
| `holders-burners` | Brass Censers (holders, boxes and burners) |

- **Sizes become variants.** The store lists each size as its own product ("11″ Incense — 100 Sticks"). Names are split on " — " and merged into one product with a Type dropdown. Variant ids are the Woo product ids (what a cart/checkout call will need).
- **Sold out**: `is_in_stock: false` shows "Sold out" and disables add-to-bag.
- **Stone / numeral / swatch colour** come from the brand table (`TRIBES`). Ephraim is a black-and-white banded swatch and Manasseh dark brown, neither with a stone name. Dan and Joseph are in the brand table but not in the store.
- **Character** (used by the Finder) is not a store field, so it is inferred from the product copy by keyword (`inferCharacter`), default Warm. Better: add a `Character` product attribute in WooCommerce and it will be used instead (same for `Stone`, `Numeral`, `Colour`).
- **Subscriptions are dark**: hidden everywhere (product toggle, Account deliveries, bag labels) behind `features.subscriptions` (`EXPO_PUBLIC_FEATURE_SUBSCRIPTIONS`). Code and the 10% discount maths stay in place for a later iteration.
- **Shipping** mirrors the store's WooCommerce zones (`src/domain/shipping.ts`): flat rate by destination state ($12.99 East Coast with free local pickup, $15.99 Southern states, $19.99 Midwest & West) and nothing else. No free-shipping threshold and no Express. States outside the zones can't place an order. Keep the table in sync with WooCommerce → Shipping, or override with `shipping.zones` in the catalog JSON.
- There is no "Complete the ritual" cross-sell.
- The regression fixture `__tests__/fixtures/twelve12scents.json` is a public-data export of the live catalog.

**Not done for Woo:** order placement, accounts, points and subscriptions (the checkout is still the mock). Payments on the store are WooPayments (Stripe-based; Apple Pay / Google Pay via its express checkout), PayPal and COD. Consumer keys/secrets must stay on a server, never in the app.

### Catalog data
Only the 12 tribe sprays (names, stones, colours, $35) are fixed by spec. Everything else is placeholder. Edit `scripts/generate-catalog.js` and run `npm run catalog`, or host the same JSON shape at `API_BASE_URL/catalog.json` to change content without a release. Image URLs in the catalog point at a placeholder CDN; until real photos exist, `Photo` renders a generated warm "bokeh" plate tinted with the stone colour.

## What is mocked / still to wire (not production-complete)
- **Payments**: `MockPaymentService` always succeeds. Replace with Stripe Payment Sheet (`@stripe/stripe-react-native`, needs a dev build, not Expo Go): backend creates a PaymentIntent (or Subscription for recurring lines) → `initPaymentSheet`/`presentPaymentSheet` with Apple Pay (merchant ID) / Google Pay. Physical goods: no App Store/Play IAP.
- **Auth**: Account has Apple/Google/email-link buttons wired to `MockAuthService`. Real: `expo-apple-authentication`, Google Sign-In, backend magic-link exchange. Local↔server sync of cart/favourites is not implemented.
- **Push**: only the 3-day subscription reminder date calculation exists (`notifications.ts`). Needs `expo-notifications` + a backend sender (order shipped, subscription upcoming, rewards earned).
- **Subscriptions/orders/points** are stored locally with demo seed data (Account) until a backend exists.
- Analytics events fire to a pluggable sink (console in dev).

## Accessibility
Text scales with system font size; icon buttons have labels; touch targets ≥44pt; switches/radios/steppers expose roles and state; tokens chosen for ≥4.5:1 on their backgrounds. Not yet verified with a screen reader on device.

## Release
1. Set bundle IDs in `app.json` (`com.twelvescents.app`), add icon/splash assets, and the Stripe/Apple Pay merchant config.
2. `npm i -g eas-cli && eas build:configure`
3. `eas build -p ios --profile production` / `eas build -p android --profile production`
4. `eas submit -p ios` / `eas submit -p android`
5. Ship catalog changes by updating the hosted `catalog.json` – no release needed.
