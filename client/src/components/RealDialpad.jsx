import React, { useState } from 'react';
import { Phone, PhoneCall, PhoneOff, PhoneIncoming, PhoneOutgoing, User, Sparkles, CheckCircle2, AlertCircle, ShieldCheck, Activity, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export default function RealDialpad({ clientId, onCallCompleted }) {
  const [direction, setDirection] = useState('outbound'); // 'outbound' | 'inbound'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [callStatus, setCallStatus] = useState('idle'); // idle | initiating | ringing | connected | completed
  const [statusMessage, setStatusMessage] = useState('');

  const appendDigit = (digit) => {
    setPhoneNumber(prev => prev + digit);
  };

  const handleBackspace = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  const handleDial = async () => {
    if (!phoneNumber || phoneNumber.length < 5) {
      alert('Please enter a valid E.164 phone number (e.g. +971 50..., +91 98..., +1 416...)');
      return;
    }

    try {
      setCallStatus('initiating');
      setStatusMessage(
        direction === 'inbound'
          ? 'Simulating incoming call to business DID... Trunk answering...'
          : 'Dispatching SIP INVITE to Tier-1 carrier gateway...'
      );

      const res = await fetch('/api/portal/dial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          customerPhone: phoneNumber,
          customerName: customerName.trim() || (direction === 'inbound' ? 'Inbound Caller' : 'Direct Lead'),
          direction
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Carrier dispatch error');
      }

      setCallStatus('ringing');
      setStatusMessage(
        direction === 'inbound'
          ? `Ring 1: AI Receptionist picking up call from ${phoneNumber}...`
          : `180 Ringing on E.164 endpoint ${phoneNumber}...`
      );

      // Simulated telephony stage transition for live experience
      setTimeout(() => {
        setCallStatus('connected');
        setStatusMessage(
          direction === 'inbound'
            ? '200 OK Connected: 24/7 AI Receptionist greeting caller & answering inquiry...'
            : '200 OK Connected: Sub-450ms audio synthesis pipeline active...'
        );
      }, 2500);

      setTimeout(() => {
        setCallStatus('completed');
        setStatusMessage(
          direction === 'inbound'
            ? 'Call ended. Inbound inquiry resolved & booking pass sent via WhatsApp!'
            : 'Call terminated (200 BYE). Call detail record & transcript synced!'
        );
        if (onCallCompleted) onCallCompleted(data.call);

        // Reset after 4 seconds
        setTimeout(() => {
          setCallStatus('idle');
          setStatusMessage('');
          setPhoneNumber('');
          setCustomerName('');
        }, 4000);
      }, 5500);

    } catch (err) {
      setCallStatus('idle');
      alert(err.message);
    }
  };

  return (
    <div className="bg-[#090D17]/95 border border-white/[0.1] rounded-3xl p-7 shadow-2xl backdrop-blur-2xl max-w-md w-full relative overflow-hidden">
      {/* Top subtle sheen */}
      <div className={`absolute top-0 inset-x-0 h-[2px] transition-all duration-300 ${
        direction === 'inbound' 
          ? 'bg-gradient-to-r from-transparent via-cyan-500 to-transparent' 
          : 'bg-gradient-to-r from-transparent via-emerald-500 to-transparent'
      }`} />

      {/* Mode Switcher: Outbound vs Inbound */}
      <div className="grid grid-cols-2 gap-2 mb-4 p-1 bg-[#06080F] border border-white/[0.08] rounded-2xl">
        <button
          type="button"
          disabled={callStatus !== 'idle'}
          onClick={() => setDirection('outbound')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            direction === 'outbound'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ArrowUpRight size={13} className="text-emerald-400" />
          <span>Outbound Lead Dial</span>
        </button>
        <button
          type="button"
          disabled={callStatus !== 'idle'}
          onClick={() => setDirection('inbound')}
          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            direction === 'inbound'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ArrowDownLeft size={13} className="text-cyan-400" />
          <span>Inbound AI Receptionist</span>
        </button>
      </div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${direction === 'inbound' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              {direction === 'inbound' ? <PhoneIncoming size={14} /> : <PhoneCall size={14} />}
            </div>
            <span>{direction === 'inbound' ? '24/7 Inbound Receptionist Simulator' : 'Speed-to-Lead Outbound Console'}</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">
            {direction === 'inbound' 
              ? 'Test how AI answers live callers, handles FAQs & locks bookings'
              : 'Autonomous outbound dispatch to fresh leads within 30 seconds'}
          </p>
        </div>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-bold flex items-center gap-1 ${
          direction === 'inbound' 
            ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25' 
            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
        }`}>
          <ShieldCheck size={12} />
          {direction === 'inbound' ? 'DID: 24/7' : 'STIR: A'}
        </span>
      </div>

      {/* Quick Country Switcher */}
      <div className="flex items-center gap-2 mb-4">
        {[
          { code: '+971 ', flag: '🇦🇪', label: '+971 UAE', activeColor: 'bg-amber-500/20 border-amber-500/50 text-amber-200' },
          { code: '+91 ', flag: '🇮🇳', label: '+91 India', activeColor: 'bg-orange-500/20 border-orange-500/50 text-orange-200' },
          { code: '+1 ', flag: '🇨🇦', label: '+1 Canada', activeColor: 'bg-rose-500/20 border-rose-500/50 text-rose-200' },
        ].map((c) => {
          const isActive = phoneNumber.startsWith(c.code.trim());
          return (
            <button
              key={c.code}
              type="button"
              disabled={callStatus !== 'idle'}
              onClick={() => setPhoneNumber(c.code)}
              className={`flex-1 py-1.5 px-2 rounded-xl border text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                isActive
                  ? `${c.activeColor} shadow-sm font-bold`
                  : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <span>{c.flag}</span>
              <span>{c.code.trim()}</span>
            </button>
          );
        })}
      </div>

      {/* Inputs */}
      <div className="space-y-2.5 mb-4">
        <div className="relative">
          <User size={14} className="absolute left-3.5 top-3.5 text-slate-500" />
          <input
            type="text"
            placeholder={direction === 'inbound' ? "Caller Name (e.g. Tariq / Ananya / Lucas)" : "Customer / Lead Name (e.g. Rashid / Vikram / David)"}
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            disabled={callStatus !== 'idle'}
            className="w-full bg-[#06080F] border border-white/[0.08] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder={direction === 'inbound' ? "Caller Phone (+971 / +91 / +1)" : "+971 50... / +91 98... / +1 416..."}
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={callStatus !== 'idle'}
            className="w-full bg-[#06080F] border border-white/[0.08] rounded-xl px-4 py-3 text-xl font-mono text-center text-cyan-400 tracking-wider placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition font-bold"
          />
        </div>

        {/* Live Detected Engine Indicator */}
        <div className="text-center pt-0.5">
          <span className={`text-[10px] font-mono font-semibold px-3 py-1 rounded-full inline-flex items-center gap-1.5 border ${
            phoneNumber.startsWith('+91')
              ? 'bg-orange-500/10 text-orange-300 border-orange-500/25'
              : phoneNumber.startsWith('+1')
              ? 'bg-rose-500/10 text-rose-300 border-rose-500/25'
              : phoneNumber.startsWith('+971')
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/25'
              : 'bg-white/[0.04] text-slate-400 border-white/[0.08]'
          }`}>
            <Sparkles size={11} className="text-amber-400" />
            {phoneNumber.startsWith('+91')
              ? '🇮🇳 India Engine: Natural Hinglish'
              : phoneNumber.startsWith('+1')
              ? '🇨🇦 Canada Engine: Canadian English'
              : phoneNumber.startsWith('+971')
              ? '🇦🇪 Dubai Engine: Executive English'
              : 'Auto-detecting Dialect Engine from E.164...'}
          </span>
        </div>
      </div>

      {/* Keypad Grid */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          { key: '1', sub: '' },
          { key: '2', sub: 'ABC' },
          { key: '3', sub: 'DEF' },
          { key: '4', sub: 'GHI' },
          { key: '5', sub: 'JKL' },
          { key: '6', sub: 'MNO' },
          { key: '7', sub: 'PQRS' },
          { key: '8', sub: 'TUV' },
          { key: '9', sub: 'WXYZ' },
          { key: '+', sub: '' },
          { key: '0', sub: '' },
          { key: '⌫', sub: '', action: 'backspace' },
        ].map((btn, i) => (
          <button
            key={i}
            disabled={callStatus !== 'idle'}
            onClick={() => btn.action === 'backspace' ? handleBackspace() : appendDigit(btn.key)}
            className="h-12 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-indigo-500/30 rounded-xl flex flex-col items-center justify-center text-white font-semibold transition-all duration-150 active:scale-95 disabled:opacity-40 cursor-pointer shadow-sm"
          >
            <span className="text-base font-bold">{btn.key}</span>
            {btn.sub && <span className="text-[8px] text-slate-500 font-mono">{btn.sub}</span>}
          </button>
        ))}
      </div>

      {/* Call Trigger Button / Live Progress */}
      {callStatus === 'idle' ? (
        <button
          onClick={handleDial}
          className={`w-full text-slate-950 font-extrabold py-3.5 rounded-2xl transition-all duration-200 shadow-xl flex items-center justify-center gap-2 active:scale-98 cursor-pointer ${
            direction === 'inbound'
              ? 'bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 hover:from-cyan-300 hover:to-teal-300 shadow-cyan-500/25'
              : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 shadow-emerald-500/25'
          }`}
        >
          {direction === 'inbound' ? <PhoneIncoming size={18} /> : <PhoneOutgoing size={18} />}
          <span>{direction === 'inbound' ? 'Simulate Inbound Call to Business DID' : 'Dispatch Outbound Call to Lead'}</span>
        </button>
      ) : (
        <div className="bg-[#06080F] border border-white/[0.08] rounded-2xl p-4 text-center space-y-2.5 shadow-inner">
          <div className="flex items-center justify-center gap-2.5 text-xs font-semibold">
            {callStatus === 'completed' ? (
              <CheckCircle2 size={18} className="text-emerald-400" />
            ) : (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            )}
            <span className={callStatus === 'completed' ? 'text-emerald-400 font-bold' : 'text-white'}>
              {statusMessage}
            </span>
          </div>

          {callStatus === 'connected' && (
            <div className="flex items-center justify-center gap-1.5 py-1">
              <span className="w-1.5 bg-emerald-400 rounded-full animate-wave-1" />
              <span className="w-1.5 bg-emerald-400 rounded-full animate-wave-2" />
              <span className="w-1.5 bg-emerald-400 rounded-full animate-wave-3" />
              <span className="w-1.5 bg-emerald-400 rounded-full animate-wave-4" />
              <span className="w-1.5 bg-emerald-400 rounded-full animate-wave-5" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
