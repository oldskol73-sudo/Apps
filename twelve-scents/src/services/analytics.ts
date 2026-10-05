export type AnalyticsEvent = 'view_item' | 'add_to_cart' | 'begin_checkout' | 'purchase' | 'finder_complete' | 'subscribe';
type Sink = (event: AnalyticsEvent, params?: Record<string, unknown>) => void;

let sink: Sink = (e, p) => { if (__DEV__) console.log('[analytics]', e, p ?? {}); };
/** Plug in Firebase / Segment / etc: setAnalyticsSink((e,p) => analytics().logEvent(e,p)) */
export const setAnalyticsSink = (s: Sink) => { sink = s; };
export const track: Sink = (e, p) => { try { sink(e, p); } catch { /* never break UX for analytics */ } };
