// `@instantdb/react-native` unconditionally imports `react-native-get-random-values`
// to back `uuid`'s `crypto.getRandomValues`. That package's native-module detection
// is stale (last updated for "Expo SDK 45-48") and throws `Native module not found`
// on current Expo Go, since it doesn't know how newer Expo Go registers crypto.
//
// Fix: install a working `global.crypto.getRandomValues` ourselves, using the
// first-party `expo-crypto` package, before anything imports InstantDB. This file
// must be the very first import in app/_layout.tsx — react-native-get-random-values
// only installs its (broken) fallback when `global.crypto.getRandomValues` isn't
// already a function, so setting it first makes that fallback a no-op.
import { getRandomValues } from "expo-crypto";

type CryptoLike = { getRandomValues: typeof getRandomValues };

const g = globalThis as unknown as { crypto?: CryptoLike };

if (typeof g.crypto !== "object" || g.crypto === null) {
  g.crypto = {} as CryptoLike;
}
if (typeof g.crypto.getRandomValues !== "function") {
  g.crypto.getRandomValues = getRandomValues;
}
