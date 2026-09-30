import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Volume2, VolumeX, Send, Sparkles, Bot, 
  RotateCcw, Play, Pause, Zap, CheckCircle2, AlertCircle, 
  Loader2, MessageSquare, Terminal, Shield, ArrowRight, X, PhoneCall, Flame
} from 'lucide-react';

export default function JarvisVoiceAssistant({ 
  clientId = 'client_arabians_zone',
  clientData = null,
  calls = [],
  leads = [],
  isFloating = false,
  onClose = null
}) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimSpeech, setInterimSpeech] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [languageMode, setLanguageMode] = useState('auto'); // auto | hinglish | english
  const [speechRate, setSpeechRate] = useState(1.0);
  const [speechError, setSpeechError] = useState('');
  
  const [messages, setMessages] = useState([
    {
      id: 'msg_welcome',
      sender: 'jarvis',
      text: `Greetings Sir! Main JARVIS hoon, aapka autonomous AI Intelligence Voice Companion. 

Aap mujhse **English ya Hinglish** me pooch sakte hain:
• *"Aaj kitne calls aaye aur kya hua?"*
• *"Sabse hot leads kaun si hain?"*
• *"COD orders aur appointments status"*
• *"WhatsApp delivery aur tracking status"*

Mic button dabayein aur bol kar poochein, main aapko bolkar jawab doonga!`,
      speechText: `Greetings Sir! Main JARVIS hoon. Aap mujhse English ya Hinglish me pooch sakte hain ki aaj kitne calls aaye, kya hua, ya hot leads ka kya status hai. Main aapko bolkar poori report doonga.`,
      language: 'hinglish',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const currentUtteranceRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimSpeech, loading]);

  // Initialize Speech Recognition (STT)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = languageMode === 'english' ? 'en-US' : 'hi-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError('');
        // Stop any currently playing speech when user starts talking
        stopSpeaking();
      };

      recognition.onresult = (event) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setInterimSpeech(interim || final);
        if (final) {
          handleSendQuery(final);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        setInterimSpeech('');
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission blocked. Please enable mic access.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimSpeech('');
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
      stopSpeaking();
    };
  }, [languageMode]);

  // Clean text for speech synthesis
  const cleanForSpeech = (text) => {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // remove bold asterisks
      .replace(/\*(.*?)\*/g, '$1')     // remove italics
      .replace(/•/g, '')               // remove bullets
      .replace(/#/g, '')               // remove headings
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // clean markdown links
      .replace(/https?:\/\/\S+/g, 'link')
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '') // remove emojis
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Speak aloud via Web Speech Synthesis (TTS)
  const speakAloud = (textToSpeak, lang = 'hinglish') => {
    if (!window.speechSynthesis) return;

    // Cancel current speech
    window.speechSynthesis.cancel();

    const clean = cleanForSpeech(textToSpeak);
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = speechRate;
    utterance.pitch = 0.98;

    // Pick best voice
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      if (lang === 'hinglish') {
        const hindiVoice = voices.find(v => 
          v.lang.includes('hi') || 
          v.name.toLowerCase().includes('hindi') || 
          v.name.toLowerCase().includes('india') ||
          v.lang.includes('en-IN')
        );
        if (hindiVoice) utterance.voice = hindiVoice;
      } else {
        const englishVoice = voices.find(v => 
          (v.lang.includes('en-GB') || v.name.toLowerCase().includes('uk') || v.name.toLowerCase().includes('daniel') || v.name.toLowerCase().includes('mark'))
        ) || voices.find(v => v.lang.startsWith('en'));
        if (englishVoice) utterance.voice = englishVoice;
      }
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    currentUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setSpeechError('Speech recognition is not supported in this browser. Please type your question.');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn('Speech recognition start note:', e);
      }
    }
  };

  // Main Query Handler
  const handleSendQuery = async (customPrompt = null) => {
    const textToSend = customPrompt !== null ? customPrompt : query;
    if (!textToSend || !textToSend.trim() || loading) return;

    const userText = textToSend.trim();
    setQuery('');
    setInterimSpeech('');
    
    // Add user message
    const userMsg = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch(`/api/portal/client/${clientId}/jarvis-query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userText,
          languageMode
        })
      });

      if (res.ok) {
        const data = await res.json();
        const jarvisMsg = {
          id: `jarvis_${Date.now()}`,
          sender: 'jarvis',
          text: data.reply,
          speechText: data.speechText || data.reply,
          language: data.language,
          stats: data.stats,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, jarvisMsg]);

        // Speak aloud automatically if autoSpeak is enabled
        if (autoSpeak) {
          speakAloud(jarvisMsg.speechText, jarvisMsg.language);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        const errorMsg = {
          id: `jarvis_err_${Date.now()}`,
          sender: 'jarvis',
          text: `Sir, diagnostics report: ${errData.error || 'Unable to retrieve live telemetry at this second.'}`,
          speechText: `Sir, connection error. Please try again.`,
          language: 'english',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch (err) {
      console.error('Jarvis network error:', err);
      const fallbackMsg = {
        id: `jarvis_fallback_${Date.now()}`,
        sender: 'jarvis',
        text: `Sir, live telemetry sync failed: ${err.message}`,
        speechText: `Live sync failed. Please check network.`,
        language: 'english',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    { label: '🎙️ Aaj kitne calls aaye aur kya hua?', prompt: 'Aaj kitne calls aaye aur kya hua sab detail me batao' },
    { label: '🔥 Sabse hot leads kaun si hain?', prompt: 'Sabse hot leads kaun si hain jinka score sabse high hai?' },
    { label: '📦 COD & Bookings verification status', prompt: 'COD orders aur confirmed appointments ka status batao' },
    { label: '💬 WhatsApp delivery check', prompt: 'WhatsApp par kitne messages aur order links deliver huye hain?' },
    { label: '⏱️ Balance & remaining minutes', prompt: 'Hamara used minutes aur balance kitna bacha hai?' },
    { label: '📊 Today\'s summary (English)', prompt: 'Give me a complete executive summary of today\'s calls and conversions in English' }
  ];

  return (
    <div className={`flex flex-col bg-[#070A12] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden font-sans ${
      isFloating ? 'h-[640px] max-w-lg w-full fixed bottom-6 right-6 z-50 ring-1 ring-cyan-500/40 backdrop-blur-xl' : 'w-full min-h-[700px]'
    }`}>
      
      {/* JARVIS HUD Hologram Header */}
      <div className="bg-gradient-to-r from-[#0A101F] via-[#0F172A] to-[#0A101F] px-5 py-4 border-b border-cyan-500/30 flex items-center justify-between relative overflow-hidden">
        {/* Subtle glowing circuit scanline */}
        <div className="absolute inset-0 bg-cyan-500/5 pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />

        <div className="flex items-center gap-3.5 relative z-10">
          {/* Iron Man Arc Reactor Glowing Core */}
          <div className="relative flex items-center justify-center w-11 h-11 rounded-full bg-cyan-950/80 border-2 border-cyan-400/80 shadow-[0_0_18px_rgba(6,182,212,0.5)]">
            <div className={`w-6 h-6 rounded-full bg-cyan-400/20 border border-cyan-300 flex items-center justify-center ${isSpeaking ? 'animate-ping' : ''}`}>
              <Zap size={14} className="text-cyan-300 fill-cyan-300" />
            </div>
            {isSpeaking && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white tracking-widest uppercase flex items-center gap-1.5">
                <span className="text-cyan-400">J.A.R.V.I.S.</span> VOICE AI
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/40">
                ACTIVE INTELLIGENCE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
              <span>Context:</span>
              <strong className="text-slate-200 font-semibold">{clientData?.name || 'Client Business'}</strong>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-medium">Telemetry Synced</span>
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 relative z-10">
          {/* Auto-Speak Voice Toggle */}
          <button
            onClick={() => {
              if (isSpeaking) stopSpeaking();
              setAutoSpeak(!autoSpeak);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border ${
              autoSpeak 
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title={autoSpeak ? 'Jarvis speaks answers aloud (Enabled)' : 'Speech muted (Click to enable Voice output)'}
          >
            {autoSpeak ? <Volume2 size={13} className="text-cyan-400 animate-pulse" /> : <VolumeX size={13} />}
            <span className="hidden sm:inline">{autoSpeak ? 'Voice ON' : 'Muted'}</span>
          </button>

          {/* Stop Speaking Button if currently speaking */}
          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="px-2 py-1 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-semibold flex items-center gap-1 animate-pulse"
              title="Stop current speech"
            >
              <Pause size={12} />
              <span>Halt</span>
            </button>
          )}

          {/* Close if floating */}
          {isFloating && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition"
              title="Close Jarvis"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Futuristic Sound Wave Equalizer (Dancing when speaking or listening) */}
      {(isSpeaking || isListening) && (
        <div className="bg-gradient-to-r from-cyan-950/60 via-indigo-950/60 to-cyan-950/60 px-4 py-2 border-b border-cyan-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
            </span>
            <span className="text-[11px] font-mono font-bold text-cyan-300 uppercase tracking-wider">
              {isListening ? 'Awaaz Sun Raha Hoon (Listening)...' : 'Jarvis Bol Raha Hai (Speaking)...'}
            </span>
          </div>

          <div className="flex items-center gap-1 h-5">
            {[4, 12, 18, 24, 16, 22, 14, 26, 19, 10, 16, 8].map((h, i) => (
              <div 
                key={i} 
                className="w-1 bg-cyan-400 rounded-full animate-pulse" 
                style={{ 
                  height: `${h}px`,
                  animationDuration: `${0.3 + (i % 5) * 0.15}s`
                }} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 md:p-5 overflow-y-auto space-y-4 bg-gradient-to-b from-[#070A12] via-[#090E1A] to-[#070A12]">
        {messages.map((msg) => {
          const isJarvis = msg.sender === 'jarvis';
          return (
            <div 
              key={msg.id} 
              className={`flex flex-col ${isJarvis ? 'items-start' : 'items-end'}`}
            >
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                  isJarvis ? 'text-cyan-400 flex items-center gap-1' : 'text-slate-400'
                }`}>
                  {isJarvis ? <><Bot size={11} /> J.A.R.V.I.S.</> : 'YOU'}
                </span>
                <span className="text-[9px] text-slate-500 font-mono">{msg.timestamp}</span>
              </div>

              <div className={`p-4 rounded-2xl max-w-[90%] md:max-w-[85%] text-xs leading-relaxed relative ${
                isJarvis 
                  ? 'bg-[#0E1626] border border-cyan-500/30 text-slate-200 shadow-[0_4px_20px_rgba(6,182,212,0.06)]' 
                  : 'bg-indigo-600 text-white rounded-br-xs shadow-md'
              }`}>
                {/* Message Body with Markdown styling */}
                <div className="whitespace-pre-line space-y-2">
                  {msg.text}
                </div>

                {/* Jarvis Message Controls */}
                {isJarvis && (
                  <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono text-[10px] text-cyan-400/80">
                      {msg.language === 'hinglish' ? '🇮🇳 Hinglish Voice' : '🌐 English Voice'}
                    </span>

                    <button
                      onClick={() => speakAloud(msg.speechText || msg.text, msg.language)}
                      className="px-2 py-0.5 rounded bg-cyan-950/70 text-cyan-300 hover:bg-cyan-900 border border-cyan-700/50 flex items-center gap-1 transition cursor-pointer active:scale-95"
                      title="Replay Voice (Dobara Suno)"
                    >
                      <Volume2 size={11} />
                      <span>Sunao (Play)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Interim Speech Indicator while user is speaking */}
        {isListening && interimSpeech && (
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono text-cyan-400 mb-1 flex items-center gap-1">
              <span className="animate-pulse">●</span> Listening...
            </span>
            <div className="p-3.5 rounded-2xl bg-indigo-900/40 border border-indigo-500/50 text-indigo-200 text-xs italic">
              "{interimSpeech}..."
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-start gap-2.5">
            <div className="p-3 rounded-2xl bg-[#0E1626] border border-cyan-500/30 text-cyan-300 text-xs flex items-center gap-2 shadow-lg">
              <Loader2 size={14} className="animate-spin text-cyan-400" />
              <span className="font-mono">Analyzing telemetry & crafting Jarvis intelligence brief...</span>
            </div>
          </div>
        )}

        {speechError && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{speechError}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestion Chips */}
      <div className="px-4 py-2 bg-[#090D18] border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-mono text-slate-500 shrink-0 font-bold uppercase">Quick Inquiries:</span>
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSendQuery(p.prompt)}
            disabled={loading}
            className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-cyan-950 text-slate-300 hover:text-cyan-200 border border-slate-700 hover:border-cyan-600/50 text-[11px] font-medium shrink-0 transition cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Input Bar & Microphone Trigger */}
      <div className="p-4 bg-[#0A0F1D] border-t border-cyan-500/30">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendQuery();
          }}
          className="flex items-center gap-2"
        >
          {/* Microphone Push-to-Talk Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`p-3 rounded-xl border transition flex items-center justify-center cursor-pointer active:scale-90 ${
              isListening
                ? 'bg-red-500 text-white border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse'
                : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 hover:bg-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
            }`}
            title={isListening ? 'Stop Listening' : 'Tap to speak to Jarvis (English or Hinglish)'}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          {/* Text Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask Jarvis anything in English or Hinglish... (e.g. 'aaj kitne calls aaye?')"
              disabled={loading}
              className="w-full bg-[#050811] border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="p-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold transition flex items-center justify-center cursor-pointer active:scale-95 shadow-md shadow-cyan-600/30"
            title="Send query"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>

        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono px-1">
          <div className="flex items-center gap-1.5">
            <span>Language:</span>
            <button
              type="button"
              onClick={() => setLanguageMode(languageMode === 'auto' ? 'hinglish' : languageMode === 'hinglish' ? 'english' : 'auto')}
              className="text-cyan-400 hover:underline uppercase font-bold"
            >
              {languageMode === 'auto' ? 'Auto-Detect 🌐' : languageMode === 'hinglish' ? 'Hinglish 🇮🇳' : 'English 🇬🇧'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span>Voice Speed:</span>
            <button
              type="button"
              onClick={() => setSpeechRate(speechRate === 1.0 ? 1.15 : speechRate === 1.15 ? 0.9 : 1.0)}
              className="text-slate-400 hover:text-white"
            >
              {speechRate}x
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
