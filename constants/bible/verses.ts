import kjva from "./data/kjva.json";
import { PRECEPT_TOPICS } from "./precepts";

export interface Verse {
  n: number;
  text: string;
}

// Full KJV (1769 text) + Apocrypha, 81 books / 1,361 chapters, sourced from a
// public-domain KJVA dataset and normalized to this app's book names in
// scripts (see constants/bible/data/kjva.json). Shape: book -> chapter -> verses.
export const BIBLE = kjva as unknown as Record<string, Record<string, Verse[]>>;

export function versesFor(book: string, chapter: number): Verse[] {
  return BIBLE[book]?.[String(chapter)] || [];
}

export function verseText(book: string, chapter: number, verse: number): string {
  return versesFor(book, chapter).find((v) => v.n === verse)?.text || "";
}

export interface FlatVerse {
  book: string;
  chapter: number;
  n: number;
  text: string;
  ref: string;
}

let _flat: FlatVerse[] | null = null;

function allVersesFlat(): FlatVerse[] {
  if (_flat) return _flat;
  const out: FlatVerse[] = [];
  for (const book of Object.keys(BIBLE)) {
    const displayBook = book === "Psalms" ? "Psalm" : book;
    for (const chapterKey of Object.keys(BIBLE[book])) {
      const chapter = Number(chapterKey);
      for (const v of BIBLE[book][chapterKey]) {
        out.push({ book, chapter, n: v.n, text: v.text, ref: `${displayBook} ${chapter}:${v.n}` });
      }
    }
  }
  _flat = out;
  return out;
}

export interface SearchMatch extends FlatVerse {
  matchStart: number;
  matchEnd: number;
}

const SEARCH_RESULT_LIMIT = 60;

export function searchVerses(query: string, scopeBooks?: string[]): SearchMatch[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scopeSet = scopeBooks ? new Set(scopeBooks) : null;
  const pool = scopeSet ? allVersesFlat().filter((v) => scopeSet.has(v.book)) : allVersesFlat();
  const results: SearchMatch[] = [];
  for (const v of pool) {
    const idx = v.text.toLowerCase().indexOf(q);
    if (idx !== -1) {
      results.push({ ...v, matchStart: idx, matchEnd: idx + q.length });
      if (results.length >= SEARCH_RESULT_LIMIT) break;
    }
  }
  return results;
}

export interface DailyVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  ref: string;
  note?: string;
}

// The verse the daily rotation starts on. Day 0 (DAILY_VERSE_EPOCH) shows this verse;
// each subsequent calendar day advances one entry through the precepts ref pool below.
const DAILY_VERSE_START_REF = "Jeremiah 14:2";
const DAILY_VERSE_EPOCH = new Date(2026, 7, 24); // 2026-08-24, local midnight

function parseRef(ref: string): { book: string; chapter: number; verse: number } | null {
  const m = ref.match(/^(.+) (\d+):(\d+)(?:-\d+)?$/);
  if (!m) return null;
  const book = m[1] === "Psalm" ? "Psalms" : m[1];
  return { book, chapter: Number(m[2]), verse: Number(m[3]) };
}

let _dailyVersePool: (DailyVerse & { book: string })[] | null = null;

// Every distinct scripture reference cited across PRECEPT_TOPICS, in the order they
// first appear, each resolved to its full KJV text.
function dailyVersePool(): DailyVerse[] {
  if (_dailyVersePool) return _dailyVersePool;
  const seen = new Set<string>();
  const out: DailyVerse[] = [];
  for (const topic of PRECEPT_TOPICS) {
    for (const r of topic.refs) {
      if (seen.has(r.ref)) continue;
      const parsed = parseRef(r.ref);
      if (!parsed) continue;
      const text = verseText(parsed.book, parsed.chapter, parsed.verse);
      if (!text) continue;
      seen.add(r.ref);
      out.push({ ...parsed, text, ref: r.ref, note: r.note });
    }
  }
  _dailyVersePool = out;
  return out;
}

export function getDailyVerse(date: Date = new Date()): DailyVerse {
  const pool = dailyVersePool();
  const startIdx = Math.max(
    0,
    pool.findIndex((v) => v.ref === DAILY_VERSE_START_REF)
  );
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayIndex = Math.round((today.getTime() - DAILY_VERSE_EPOCH.getTime()) / 86400000);
  const idx = ((startIdx + dayIndex) % pool.length + pool.length) % pool.length;
  return pool[idx];
}

/** Picks a fresh random verse from the same pool as getDailyVerse — used to vary the
 * verse-of-the-day each time the app is opened, rather than once per calendar day. */
export function getRandomVerse(): DailyVerse {
  const pool = dailyVersePool();
  return pool[Math.floor(Math.random() * pool.length)];
}
