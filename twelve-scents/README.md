# Twelve Scents

Expo (React Native + TypeScript, expo-router) shopping app for Twelve Scents: room sprays, incense, resins, oils, charcoal and brass censers, organised around the 12 tribes.

## Setup
```bash
cd twelve-scents
npm install
npm start          # then press i (iOS sim), a (Android emulator) or w (web)
npm run typecheck  # tsc --noEmit
npm test           # unit tests (cart math, shipping, points, subscription discount, finder ranking, search)
```
The app runs fully on mock data with no keys. Fonts (Bodoni Moda, Jost; OFL) are bundled via `@expo-google-fonts/*`.

## Environment
Copy `.env.example` to `.env` (all `EXPO_PUBLIC_*`, read in `src/data/index.ts`):

| Key | Purpose |
|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | If set, catalog is fetched from `{url}/catalog.json` (falls back to the bundled copy when offline) |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key for the Payment Sheet |
| `EXPO_PUBLIC_FREE_SHIPPING_THRESHOLD` | Free-shipping threshold, default `60` (the catalog JSON's `freeShippingThreshold` wins when present) |

## Architecture
- `src/theme` – every colour/type/shape token. Views import tokens; no hard-coded colours.
- `src/domain` – pure logic (`pricing.ts`: cart, shipping, points, tiers, finder ranking, search/sort). Unit-tested in `__tests__`.
- `src/data` – `CatalogRepository` interface; `MockCatalogRepository` (bundled `catalog.json`), `RemoteCatalogRepository` (REST). Add a `ShopifyCatalogRepository` (Storefront API) behind the same interface and select it in `src/data/index.ts`.
- `src/services` – `analytics` (view_item, add_to_cart, begin_checkout, purchase, finder_complete, subscribe), `payments`, `auth`, `notifications`. These are **interfaces with mock implementations** (see below).
- `src/state` – store (cart, favourites, user, subscriptions, orders; persisted to AsyncStorage) and catalog provider (loading/ready/error).
- `app/` – routes: `(tabs)` Shop · Browse · Finder · Bag · Account; pushed `product/[id]`, `checkout`, `confirmed`. Search is the header magnifier → Browse with the search field open.

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
