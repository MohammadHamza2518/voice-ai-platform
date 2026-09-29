import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, Download, FastForward } from 'lucide-react';

export default function AudioPlayer({ audioUrl, title = 'Call Audio Recording' }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration || 0);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', onEnded);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.log('Audio play error:', e));
    }
  };

  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="bg-[#0A0E1A] border border-white/[0.08] rounded-2xl p-4 shadow-xl backdrop-blur-xl">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Header Info */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
          <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={cycleSpeed}
            className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] text-emerald-400 border border-white/10 hover:bg-white/[0.08] transition cursor-pointer font-bold"
            title="Playback Speed"
          >
            {playbackRate}x
          </button>
          {audioUrl && (
            <a
              href={audioUrl}
              download="call_recording.mp3"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-white transition p-1 rounded-md hover:bg-white/[0.04]"
              title="Download MP3"
            >
              <Download size={14} />
            </a>
          )}
        </div>
      </div>

      {/* Simulated Waveform Visualizer */}
      <div className="flex items-center justify-between gap-1 h-9 px-2 mb-3.5 bg-[#06080F] rounded-xl border border-white/[0.04] overflow-hidden">
        {[4, 8, 14, 20, 26, 18, 12, 6, 16, 24, 28, 22, 14, 8, 18, 26, 20, 10, 16, 22, 14, 8, 12, 18, 24, 16, 8, 4].map((h, i) => {
          const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
          const barPercent = (i / 28) * 100;
          const isPassed = barPercent <= progressPercent;

          return (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-150 ${
                isPassed 
                  ? 'bg-gradient-to-t from-emerald-500 to-cyan-400' 
                  : 'bg-slate-800'
              } ${isPlaying ? 'opacity-100' : 'opacity-60'}`}
              style={{
                height: isPlaying ? `${Math.max(4, (h * (0.6 + Math.random() * 0.7)))}px` : `${h}px`
              }}
            />
          );
        })}
      </div>

      {/* Controls & Scrubber */}
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="w-9 h-9 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 flex items-center justify-center transition active:scale-95 shadow-md shadow-emerald-500/20 cursor-pointer"
        >
          {isPlaying ? <Pause size={16} className="fill-slate-950" /> : <Play size={16} className="fill-slate-950 ml-0.5" />}
        </button>

        <span className="text-xs font-mono text-slate-400 min-w-[36px]">
          {formatTime(currentTime)}
        </span>

        <input
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
        />

        <span className="text-xs font-mono text-slate-400 min-w-[36px]">
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}
