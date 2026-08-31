import { useCallback, useEffect, useRef, useState } from "react";
import { useAudioPlayer as useExpoAudioPlayer, useAudioPlayerStatus } from "expo-audio";

export interface AudioTrack {
  book: string;
  chapter: number;
}

const SPEEDS = [1, 1.25, 1.5, 2];
const SIMULATED_DURATION = 180;

/**
 * Plays a real uploaded narration file when one exists for book+chapter;
 * otherwise runs a simulated placeholder timer standing in for a future
 * narrated-audio backend (per the design's audio spec).
 */
export function useAudioPlayer() {
  const player = useExpoAudioPlayer(null);
  const status = useAudioPlayerStatus(player);

  const [track, setTrack] = useState<AudioTrack | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);
  const [simPlaying, setSimPlaying] = useState(false);
  const [simPosition, setSimPosition] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [showPlayer, setShowPlayer] = useState(false);

  const simTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearSim = useCallback(() => {
    if (simTimer.current) {
      clearInterval(simTimer.current);
      simTimer.current = null;
    }
  }, []);

  const startSimTimer = useCallback(() => {
    clearSim();
    simTimer.current = setInterval(() => {
      setSimPosition((p) => {
        if (p + 1 >= SIMULATED_DURATION) {
          setSimPlaying(false);
          clearSim();
          return SIMULATED_DURATION;
        }
        return p + 1;
      });
    }, 1000);
  }, [clearSim]);

  const openTrack = useCallback(
    (t: AudioTrack, audioUrl?: string) => {
      clearSim();
      setTrack(t);
      setShowPlayer(true);

      if (audioUrl) {
        setIsSimulated(false);
        player.replace({ uri: audioUrl });
        player.seekTo(0);
        player.play();
      } else {
        setIsSimulated(true);
        player.pause();
        setSimPosition(0);
        setSimPlaying(true);
        startSimTimer();
      }
    },
    [player, clearSim, startSimTimer]
  );

  const togglePlay = useCallback(() => {
    if (isSimulated) {
      setSimPlaying((wasPlaying) => {
        const next = !wasPlaying;
        if (next) startSimTimer();
        else clearSim();
        return next;
      });
    } else {
      if (status.playing) player.pause();
      else player.play();
    }
  }, [isSimulated, player, status.playing, startSimTimer, clearSim]);

  const seek = useCallback(
    (seconds: number) => {
      const duration = isSimulated ? SIMULATED_DURATION : status.duration || 0;
      const clamped = Math.max(0, Math.min(duration, seconds));
      if (isSimulated) {
        setSimPosition(clamped);
      } else {
        player.seekTo(clamped);
      }
    },
    [isSimulated, status.duration, player]
  );

  const skip = useCallback(
    (delta: number) => {
      const current = isSimulated ? simPosition : status.currentTime || 0;
      seek(current + delta);
    },
    [isSimulated, simPosition, status.currentTime, seek]
  );

  const cycleSpeed = useCallback(() => {
    const idx = SPEEDS.indexOf(speed);
    const next = SPEEDS[(idx + 1) % SPEEDS.length];
    setSpeed(next);
    if (!isSimulated) player.setPlaybackRate(next);
  }, [speed, isSimulated, player]);

  const closePlayer = useCallback(() => {
    setShowPlayer(false);
  }, []);

  const stop = useCallback(() => {
    clearSim();
    player.pause();
    setTrack(null);
    setSimPlaying(false);
    setSimPosition(0);
    setShowPlayer(false);
  }, [clearSim, player]);

  useEffect(() => () => clearSim(), [clearSim]);

  return {
    track,
    playing: isSimulated ? simPlaying : status.playing,
    position: isSimulated ? simPosition : status.currentTime || 0,
    duration: isSimulated ? SIMULATED_DURATION : status.duration || SIMULATED_DURATION,
    speed,
    showPlayer,
    setShowPlayer,
    openTrack,
    togglePlay,
    seek,
    skip,
    cycleSpeed,
    closePlayer,
    stop,
  };
}
