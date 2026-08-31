import React, { createContext, useContext, useMemo, useState, useCallback, useRef } from "react";
import { useSharedValue, SharedValue } from "react-native-reanimated";
import { useGuestAuth } from "@/hooks/useGuestAuth";
import {
  useSettings,
  useBookmarks,
  useHighlights,
  useNotes,
  usePlanProgress,
  refKey,
} from "@/hooks/useBibleStore";
import { useNarrations } from "@/hooks/useNarrations";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { ATMOSPHERES, AtmosphereKey, Palette, HighlightColorKey } from "@/constants/theme";

export type TabKey = "today" | "read" | "search" | "plans" | "library";

export interface Location {
  book: string;
  chapter: number;
}

interface AppContextValue {
  isLoading: boolean;
  userId?: string;

  palette: Palette;
  atmosphere: AtmosphereKey;
  setAtmosphere: (key: AtmosphereKey) => void;
  cycleAtmosphere: () => void;
  readerFontSize: number;
  setReaderFontSize: (n: number) => void;
  notificationsOn: boolean;
  toggleNotifications: () => void;

  desk: boolean;
  goToDesk: () => void;
  enterContinueReading: () => void;
  skipToLibrary: () => void;

  tab: TabKey;
  setTab: (t: TabKey) => void;

  location: Location;
  goTo: (book: string, chapter: number) => void;

  selectedVerse: number | null;
  selectVerse: (n: number | null) => void;

  openFootnote: number | null;
  toggleFootnote: (n: number) => void;

  readerScrollY: SharedValue<number>;

  showDrawer: boolean;
  setShowDrawer: (v: boolean) => void;
  showBookPicker: boolean;
  setShowBookPicker: (v: boolean) => void;
  showNoteComposer: boolean;
  setShowNoteComposer: (v: boolean) => void;
  showSettings: boolean;
  setShowSettings: (v: boolean) => void;
  showPrecepts: boolean;
  setShowPrecepts: (v: boolean) => void;
  showHowToUse: boolean;
  setShowHowToUse: (v: boolean) => void;
  showAbout: boolean;
  setShowAbout: (v: boolean) => void;
  showChronoDetail: boolean;
  setShowChronoDetail: (v: boolean) => void;
  showSinBattles: boolean;
  setShowSinBattles: (v: boolean) => void;
  showStudyCategories: boolean;
  setShowStudyCategories: (v: boolean) => void;
  showWeeklyStudy: boolean;
  setShowWeeklyStudy: (v: boolean) => void;

  bookmarks: ReturnType<typeof useBookmarks>;
  highlights: ReturnType<typeof useHighlights>;
  notes: ReturnType<typeof useNotes>;
  chronoProgress: ReturnType<typeof usePlanProgress>;
  sinProgress: ReturnType<typeof usePlanProgress>;
  studyCategoryProgress: ReturnType<typeof usePlanProgress>;
  studyWeeklyProgress: ReturnType<typeof usePlanProgress>;

  toast: string | null;
  showToast: (msg: string) => void;

  refKey: typeof refKey;

  narrations: ReturnType<typeof useNarrations>;
  audio: ReturnType<typeof useAudioPlayer>;
  playChapter: (book: string, chapter: number) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { isLoading: authLoading, user } = useGuestAuth();
  const userId = user?.id;

  const settings = useSettings(userId);
  const bookmarks = useBookmarks(userId);
  const highlights = useHighlights(userId);
  const notes = useNotes(userId);
  const chronoProgress = usePlanProgress(userId, "chrono");
  const sinProgress = usePlanProgress(userId, "sin");
  const studyCategoryProgress = usePlanProgress(userId, "studyCategory");
  const studyWeeklyProgress = usePlanProgress(userId, "studyWeekly");
  const narrations = useNarrations(userId);
  const audio = useAudioPlayer();

  const [desk, setDesk] = useState(true);
  const [tab, setTab] = useState<TabKey>("today");
  const [location, setLocation] = useState<Location>({ book: "John", chapter: 3 });
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [openFootnote, setOpenFootnote] = useState<number | null>(null);
  const readerScrollY = useSharedValue(0);

  const [showDrawer, setShowDrawer] = useState(false);
  const [showBookPicker, setShowBookPicker] = useState(false);
  const [showNoteComposer, setShowNoteComposer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPrecepts, setShowPrecepts] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showChronoDetail, setShowChronoDetail] = useState(false);
  const [showSinBattles, setShowSinBattles] = useState(false);
  const [showStudyCategories, setShowStudyCategories] = useState(false);
  const [showWeeklyStudy, setShowWeeklyStudy] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const atmosphere = settings.atmosphere;
  const palette = ATMOSPHERES[atmosphere];

  const goToDesk = useCallback(() => {
    setDesk(true);
    setShowDrawer(false);
  }, []);

  const enterContinueReading = useCallback(() => {
    setDesk(false);
    setTab("read");
  }, []);

  const skipToLibrary = useCallback(() => {
    setDesk(false);
    setTab("today");
  }, []);

  const goTo = useCallback((book: string, chapter: number) => {
    setDesk(false);
    setLocation({ book, chapter });
    setTab("read");
    setSelectedVerse(null);
    setOpenFootnote(null);
  }, []);

  const selectVerse = useCallback((n: number | null) => {
    setSelectedVerse(n);
  }, []);

  const toggleFootnote = useCallback((n: number) => {
    setOpenFootnote((cur) => (cur === n ? null : n));
  }, []);

  const playChapter = useCallback(
    (book: string, chapter: number) => {
      const existing = narrations.narrationFor(book, chapter);
      audio.openTrack({ book, chapter }, existing?.audioFile?.url);
    },
    [narrations, audio]
  );

  const value = useMemo<AppContextValue>(
    () => ({
      isLoading: authLoading,
      userId,
      palette,
      atmosphere,
      setAtmosphere: settings.setAtmosphere,
      cycleAtmosphere: settings.cycleAtmosphere,
      readerFontSize: settings.readerFontSize,
      setReaderFontSize: settings.setReaderFontSize,
      notificationsOn: settings.notificationsOn,
      toggleNotifications: settings.toggleNotifications,
      desk,
      goToDesk,
      enterContinueReading,
      skipToLibrary,
      tab,
      setTab,
      location,
      goTo,
      selectedVerse,
      selectVerse,
      openFootnote,
      toggleFootnote,
      readerScrollY,
      showDrawer,
      setShowDrawer,
      showBookPicker,
      setShowBookPicker,
      showNoteComposer,
      setShowNoteComposer,
      showSettings,
      setShowSettings,
      showPrecepts,
      setShowPrecepts,
      showHowToUse,
      setShowHowToUse,
      showAbout,
      setShowAbout,
      showChronoDetail,
      setShowChronoDetail,
      showSinBattles,
      setShowSinBattles,
      showStudyCategories,
      setShowStudyCategories,
      showWeeklyStudy,
      setShowWeeklyStudy,
      bookmarks,
      highlights,
      notes,
      chronoProgress,
      sinProgress,
      studyCategoryProgress,
      studyWeeklyProgress,
      toast,
      showToast,
      refKey,
      narrations,
      audio,
      playChapter,
    }),
    [
      authLoading,
      userId,
      palette,
      atmosphere,
      settings,
      desk,
      goToDesk,
      enterContinueReading,
      skipToLibrary,
      tab,
      location,
      goTo,
      selectedVerse,
      selectVerse,
      openFootnote,
      toggleFootnote,
      readerScrollY,
      showDrawer,
      showBookPicker,
      showNoteComposer,
      showSettings,
      showPrecepts,
      showHowToUse,
      showAbout,
      showChronoDetail,
      showSinBattles,
      showStudyCategories,
      showWeeklyStudy,
      bookmarks,
      highlights,
      notes,
      chronoProgress,
      sinProgress,
      studyCategoryProgress,
      studyWeeklyProgress,
      toast,
      showToast,
      narrations,
      audio,
      playChapter,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export type { HighlightColorKey };
