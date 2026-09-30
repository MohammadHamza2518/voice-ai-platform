import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, PhoneCall, Search, Filter, CheckCircle2, 
  Sparkles, Calendar, TrendingUp, Users, ArrowRight, 
  Volume2, ShieldCheck, PhoneForwarded, Radio, X, Mic
} from 'lucide-react';

export default function AiPipelineOverview({ 
  onSelectTab, 
  leadsCount = 500, 
  callsCount = 320, 
  clientName = "Your Business",
  assignedNumber = "+91 80-48799695"
}) {
  const [playingId, setPlayingId] = useState(null);
  const [demoPhoneModal, setDemoPhoneModal] = useState(false);
  const [callState, setCallState] = useState('incoming'); // incoming | connected | ended
  const [callTimer, setCallTimer] = useState(0);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const timerRef = useRef(null);

  // Sample recordings matching the exact viral reel showcase
  const sampleRecordings = [
    {
      id: 'rec_1',
      name: 'Akash Sharma',
      company: 'TechCorp India',
      duration: '02:14',
      badge: 'Meeting Booked',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      speech: "Hello Akash! This is the automated AI assistant following up on your inquiry. We found your profile through Apollo, and I wanted to schedule a 15-minute quick strategy call for Thursday. Would 3 PM work for you?"
    },
    {
      id: 'rec_2',
      name: 'Priya Mehta',
      company: 'GrowthLabs Global',
      duration: '01:45',
      badge: 'Qualified Lead',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      speech: "Hi Priya! Calling to confirm if GrowthLabs is currently accepting new outbound leads for Q4. Great! Let me sync our verified contact package with your sales team right away."
    },
    {
      id: 'rec_3',
      name: 'Rahul Verma',
      company: 'InnovateX Media',
      duration: '03:12',
      badge: 'Follow-up Required',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      speech: "Hello Rahul, understood. You mentioned your team is in a meeting right now. I will trigger an automated SMS summary and schedule a follow-up call tomorrow at 11 AM."
    },
    {
      id: 'rec_4',
      name: 'Sneha Kapoor',
      company: 'CloudScale Tech',
      duration: '02:08',
      badge: 'Meeting Booked',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      speech: "Hi Sneha! We verified your company domain and requirement. Meeting is confirmed on your Google Calendar for Friday morning. Thank you for your time!"
    }
  ];

  // Handle Play/Pause with Web Speech API
  const handleTogglePlay = (rec) => {
    if (playingId === rec.id) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setPlayingId(null);
      return;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(rec.speech);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.onend = () => setPlayingId(null);
      utterance.onerror = () => setPlayingId(null);
      window.speechSynthesis.speak(utterance);
    }

    setPlayingId(rec.id);
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Demo Phone Call Timer
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => {
        setCallTimer(prev => prev + 1);
      }, 1000);

      // Play demo voice script
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const speech = new SpeechSynthesisUtterance(
          "Hello! This is your AI Outbound Voice Agent calling live. I find verified Apollo leads, handle customer objections, and book high-ticket meetings 24/7 directly onto your calendar!"
        );
        speech.rate = 1.0;
        window.speechSynthesis.speak(speech);
      }
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCallTimer(0);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full space-y-6">
      {/* ========================================================
          HERO HEADER (Clean Light Lavender/White Theme as seen in Viral Reel)
          ======================================================== */}
      <div className="text-center pt-3 pb-2 space-y-2.5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-bold tracking-wide shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Automated 24/7</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
          AI <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Lead Generation</span>
        </h1>

        <p className="text-sm md:text-base text-slate-600 font-medium max-w-xl mx-auto">
          Finds leads. Calls them. Gets you results.
        </p>
      </div>

      {/* ========================================================
          THE 3 PIPELINE STEPS (Crisp Light Theme Cards from Video)
          ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
        
        {/* STEP 1: FINDS LEADS (Apollo Integration) */}
        <div 
          onClick={() => onSelectTab && onSelectTab('find_leads')}
          className="group relative bg-white hover:bg-slate-50/70 border border-slate-200/90 hover:border-indigo-400 rounded-3xl p-6 transition-all duration-300 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-indigo-100/50 flex flex-col justify-between cursor-pointer"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 font-black flex items-center justify-center text-sm border border-indigo-200">
                1
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 group-hover:text-indigo-600 transition">
                  Finds Leads
                </h3>
                <p className="text-xs text-slate-500">
                  Searches and collects targeted leads from Apollo
                </p>
              </div>
            </div>

            {/* Apollo Brand Box */}
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-3.5 flex items-center gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#F6BE22] text-slate-900 font-black flex items-center justify-center text-lg shadow-sm shrink-0">
                <span className="tracking-tighter">▲</span>
              </div>
              <div>
                <div className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <span>Apollo</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-200/60 text-amber-800 font-bold border border-amber-300">
                    Live Engine
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 font-medium">
                  Global B2B Decision-Maker Database
                </div>
              </div>
            </div>

            {/* Sub-Feature Items */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-start gap-2.5 text-xs text-slate-700 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                <Search size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block font-semibold">Search your target audience</strong>
                  <span className="text-[11px] text-slate-500">Specify exact niche, companies or buyer profile</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-slate-700 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                <Filter size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block font-semibold">Apply filters</strong>
                  <span className="text-[11px] text-slate-500">Industry, Location, Job Title & Headcount</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-slate-700 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block font-semibold">Collect verified leads</strong>
                  <span className="text-[11px] text-slate-500">Name, Direct Phone, Email & Company Domain</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-bold">
            <span>Launch Apollo Lead Finder</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* STEP 2: AI CALLING AGENT */}
        <div className="group relative bg-white hover:bg-slate-50/70 border border-slate-200/90 hover:border-blue-400 rounded-3xl p-6 transition-all duration-300 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-blue-100/50 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 font-black flex items-center justify-center text-sm border border-blue-200">
                2
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  AI Calling Agent
                </h3>
                <p className="text-xs text-slate-500">
                  Automatically calls the leads using AI
                </p>
              </div>
            </div>

            {/* Glowing Call Orb with Live Waveform */}
            <div className="py-3 flex flex-col items-center justify-center space-y-3">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-600/30 text-white animate-pulse">
                  <PhoneCall size={32} className="animate-bounce" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-indigo-400/50 animate-ping opacity-30 pointer-events-none"></div>
              </div>

              {/* Sound Wave Bars */}
              <div className="flex items-center gap-1.5 h-6">
                {[4, 12, 22, 16, 26, 14, 20, 8, 18, 10, 24, 12].map((height, i) => (
                  <span
                    key={i}
                    style={{ height: `${height}px` }}
                    className="w-1 bg-gradient-to-t from-blue-600 to-indigo-500 rounded-full animate-pulse"
                  />
                ))}
              </div>
            </div>

            {/* Key AI Capabilities Checklist */}
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <CheckCircle2 size={16} className="text-blue-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-800">Human-like AI voice</span>
              </div>

              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <CheckCircle2 size={16} className="text-blue-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-800">Handles objections</span>
              </div>

              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <CheckCircle2 size={16} className="text-blue-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-800">Qualifies the lead</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100 flex items-center gap-2">
            <button
              onClick={() => {
                setCallState('incoming');
                setDemoPhoneModal(true);
              }}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-xs shadow-md shadow-indigo-600/25 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <PhoneForwarded size={14} />
              <span>Test Live Call</span>
            </button>
            <button
              onClick={() => onSelectTab && onSelectTab('auto_dialer')}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition cursor-pointer"
              title="Open full auto-dialer"
            >
              Queue →
            </button>
          </div>
        </div>

        {/* STEP 3: CALL RECORDINGS */}
        <div 
          className="group relative bg-white hover:bg-slate-50/70 border border-slate-200/90 hover:border-emerald-400 rounded-3xl p-6 transition-all duration-300 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-emerald-100/50 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 font-black flex items-center justify-center text-sm border border-emerald-200">
                  3
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-600 transition">
                    Call Recordings
                  </h3>
                  <p className="text-xs text-slate-500">
                    Listen to every call and track results
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-bold">
                Live Feed
              </span>
            </div>

            {/* Interactive Call Previews List */}
            <div className="space-y-2 pt-1">
              {sampleRecordings.map((rec) => {
                const isPlaying = playingId === rec.id;
                return (
                  <div
                    key={rec.id}
                    className={`p-2.5 rounded-2xl border transition-all ${
                      isPlaying
                        ? 'bg-indigo-50/80 border-indigo-300 shadow-sm'
                        : 'bg-slate-50/90 border-slate-200/70 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          onClick={() => handleTogglePlay(rec)}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center transition shrink-0 cursor-pointer ${
                            isPlaying
                              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                              : 'bg-white hover:bg-indigo-600 hover:text-white text-slate-700 border border-slate-200 shadow-xs'
                          }`}
                          title={isPlaying ? 'Pause audio' : 'Play call audio demo'}
                        >
                          {isPlaying ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
                        </button>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {rec.name}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {rec.company}
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${rec.badgeColor}`}>
                          {rec.badge}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 font-semibold">
                          {rec.duration}
                        </span>
                      </div>
                    </div>

                    {/* Animated Waveform when playing */}
                    {isPlaying && (
                      <div className="mt-2 pt-2 border-t border-indigo-200/60 flex items-center justify-between gap-1 px-1">
                        <div className="flex items-center gap-1 flex-1">
                          {[6, 14, 22, 10, 18, 24, 12, 20, 8, 16, 24, 14, 18, 8, 12].map((h, idx) => (
                            <span
                              key={idx}
                              style={{ height: `${h}px` }}
                              className="w-1 bg-indigo-600 rounded-full animate-pulse"
                            />
                          ))}
                        </div>
                        <span className="text-[9px] font-mono text-indigo-700 font-bold shrink-0">
                          Playing AI Demo...
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div 
            onClick={() => onSelectTab && onSelectTab('recordings')}
            className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-600 font-bold cursor-pointer"
          >
            <span>View All Full Recordings & Transcripts</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition" />
          </div>
        </div>
      </div>

      {/* ========================================================
          BOTTOM SYSTEM BANNER ("From Leads to Meetings" - Light Theme)
          ======================================================== */}
      <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/90 to-purple-50/90 border border-indigo-100 rounded-3xl p-5 md:p-6 shadow-xl shadow-indigo-100/40 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/25 shrink-0">
              <TrendingUp size={24} />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-extrabold text-slate-900">
                From Leads to <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Meetings</span>
              </h2>
              <p className="text-xs text-slate-600">
                A complete automated system that finds, calls and qualifies leads for you — 24/7.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden sm:inline font-medium">Operating Agent:</span>
            <span className="px-3 py-1 rounded-xl bg-white border border-indigo-100 text-xs font-mono font-bold text-slate-800 shadow-xs">
              {clientName}
            </span>
          </div>
        </div>

        {/* 4 Big Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-white/95 border border-indigo-100/80 rounded-2xl p-3.5 text-center shadow-xs">
            <div className="flex items-center justify-center gap-1.5 text-blue-600 mb-1">
              <Users size={16} />
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Leads Found</span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {leadsCount > 0 ? `${leadsCount}+` : '500+'}
            </div>
          </div>

          <div className="bg-white/95 border border-indigo-100/80 rounded-2xl p-3.5 text-center shadow-xs">
            <div className="flex items-center justify-center gap-1.5 text-indigo-600 mb-1">
              <PhoneCall size={16} />
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Calls Made</span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {callsCount > 0 ? callsCount : '320'}
            </div>
          </div>

          <div className="bg-white/95 border border-indigo-100/80 rounded-2xl p-3.5 text-center shadow-xs">
            <div className="flex items-center justify-center gap-1.5 text-emerald-600 mb-1">
              <CheckCircle2 size={16} />
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Qualified Leads</span>
            </div>
            <div className="text-2xl font-black text-emerald-600 font-mono">
              85
            </div>
          </div>

          <div className="bg-white/95 border border-indigo-100/80 rounded-2xl p-3.5 text-center shadow-xs">
            <div className="flex items-center justify-center gap-1.5 text-purple-600 mb-1">
              <Calendar size={16} />
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Meetings Booked</span>
            </div>
            <div className="text-2xl font-black text-purple-600 font-mono">
              28
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          LIVE PHONE DEMO MODAL (Interactive Reel Experience)
          ======================================================== */}
      {demoPhoneModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm bg-[#090D18] border border-white/15 rounded-[40px] p-6 shadow-2xl shadow-indigo-600/30 overflow-hidden flex flex-col items-center">
            {/* Top Close Button */}
            <button
              onClick={() => {
                setDemoPhoneModal(false);
                setCallState('ended');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-white/10"
            >
              <X size={18} />
            </button>

            {/* Dynamic Island / Speaker notch */}
            <div className="w-24 h-4 bg-black rounded-full mb-6 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-800 mr-2"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-blue-900"></div>
            </div>

            {callState === 'incoming' && (
              <div className="text-center space-y-6 w-full py-4">
                <div className="space-y-1">
                  <span className="text-xs text-indigo-400 font-mono uppercase tracking-widest">
                    Incoming AI Call...
                  </span>
                  <h3 className="text-xl font-black text-white">
                    {assignedNumber}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Voice Calling Agent
                  </p>
                </div>

                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-600/40 animate-pulse">
                  <PhoneCall size={38} className="text-white" />
                </div>

                <div className="text-xs text-slate-400 max-w-xs mx-auto">
                  Click <strong>Accept</strong> below to hear the human-like outbound sales agent in real-time.
                </div>

                <div className="flex items-center justify-center gap-12 pt-4">
                  <button
                    onClick={() => {
                      setCallState('ended');
                      setDemoPhoneModal(false);
                    }}
                    className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 cursor-pointer active:scale-95"
                  >
                    <X size={24} />
                  </button>
                  <button
                    onClick={() => setCallState('connected')}
                    className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 cursor-pointer active:scale-95 animate-bounce"
                  >
                    <PhoneCall size={24} />
                  </button>
                </div>
              </div>
            )}

            {callState === 'connected' && (
              <div className="text-center space-y-5 w-full py-2">
                <div className="space-y-1">
                  <span className="text-xs text-emerald-400 font-mono font-bold">
                    Connected • {formatTimer(callTimer)}
                  </span>
                  <h3 className="text-xl font-black text-white">
                    {assignedNumber}
                  </h3>
                  <p className="text-xs text-indigo-300">
                    AI Sales Representative (Live Voice)
                  </p>
                </div>

                {/* Subtitle speech transcript box */}
                <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 text-left text-xs text-slate-200 leading-relaxed shadow-inner min-h-[100px] flex items-center">
                  <p className="italic">
                    "Hello! This is your AI Outbound Voice Agent calling live. I find verified Apollo leads, handle customer objections, and book high-ticket meetings 24/7 directly onto your calendar!"
                  </p>
                </div>

                {/* Phone Call Controls */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <button 
                    onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                    className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition ${
                      isSpeakerOn ? 'bg-white text-slate-900 border-white' : 'bg-white/[0.05] text-slate-300 border-white/10'
                    }`}
                  >
                    <Volume2 size={18} />
                    <span>Speaker</span>
                  </button>

                  <button className="p-3 rounded-2xl bg-white/[0.05] border border-white/10 text-slate-300 text-xs font-semibold flex flex-col items-center gap-1.5">
                    <Radio size={18} />
                    <span>Facetime</span>
                  </button>

                  <button className="p-3 rounded-2xl bg-white/[0.05] border border-white/10 text-slate-300 text-xs font-semibold flex flex-col items-center gap-1.5">
                    <Mic size={18} />
                    <span>Mute</span>
                  </button>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => {
                      setCallState('ended');
                      setDemoPhoneModal(false);
                    }}
                    className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 mx-auto cursor-pointer active:scale-95"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
