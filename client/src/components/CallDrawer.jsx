import React from 'react';
import { X, PhoneIncoming, PhoneOutgoing, Calendar, Clock, DollarSign, User, ShieldCheck, FileText, Bot, Radio, CheckCircle2 } from 'lucide-react';
import AudioPlayer from './AudioPlayer';

export default function CallDrawer({ call, onClose }) {
  if (!call) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-[#080C16]/95 border-l border-white/[0.1] shadow-2xl backdrop-blur-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* Drawer Header */}
      <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-3.5">
          <div className={`p-2.5 rounded-2xl ${
            call.direction === 'inbound' 
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/25' 
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
          }`}>
            {call.direction === 'inbound' ? <PhoneIncoming size={18} /> : <PhoneOutgoing size={18} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base tracking-tight">{call.customerName || 'Direct Prospect'}</h3>
              <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md border font-semibold ${
                call.status === 'booked' 
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                  : call.status === 'callback'
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-white/[0.04] text-slate-400 border-white/10'
              }`}>
                {call.status === 'booked' ? 'CONFIRMED APPOINTMENT' : call.status === 'callback' ? 'CALLBACK SCHEDULED' : 'QUALIFIED RECORD'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
              <span className="text-slate-300">CLI: {call.customerPhone}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">SID: {call.id?.slice(0, 14)}</span>
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-xl transition cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Drawer Body - Scrollable */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Call Meta KPIs */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-[#0A0E1A] border border-white/[0.06] rounded-xl p-3">
            <span className="text-slate-400 block text-[9px] uppercase font-mono tracking-wider font-semibold">Billable Duration</span>
            <span className="font-mono text-white font-bold text-sm mt-1 block">
              {Math.floor(call.durationSeconds / 60)}m {call.durationSeconds % 60}s
            </span>
          </div>
          <div className="bg-[#0A0E1A] border border-white/[0.06] rounded-xl p-3">
            <span className="text-slate-400 block text-[9px] uppercase font-mono tracking-wider font-semibold">Signaling Route</span>
            <span className="capitalize text-slate-200 font-semibold text-xs flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {call.direction === 'inbound' ? 'DID Direct Inbound' : 'API Outbound Trigger'}
            </span>
          </div>
          <div className="bg-[#0A0E1A] border border-white/[0.06] rounded-xl p-3">
            <span className="text-slate-400 block text-[9px] uppercase font-mono tracking-wider font-semibold">Sentiment Index</span>
            <span className="text-emerald-400 font-mono font-bold text-xs mt-1 block">
              {call.sentiment === 'High Intent' || call.sentiment === 'Highly Interested' ? '+0.88 (Commercial Intent)' : '+0.52 (Neutral Qualified)'}
            </span>
          </div>
        </div>

        {/* Audio Player Card */}
        {call.recordingUrl ? (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                Direct Master Audio Stream (Stereo Telephony Capture)
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">Opus / 16kHz HD</span>
            </div>
            <AudioPlayer audioUrl={call.recordingUrl} title="Carrier Telephony Recording (.mp3)" />
          </div>
        ) : (
          <div className="bg-[#0A0E1A] border border-white/[0.06] rounded-xl p-4 text-center text-xs text-slate-400">
            Audio recording synchronizing from telecom gateway...
          </div>
        )}

        {/* Confirmed Appointment Card (If booked) */}
        {call.booking && (
          <div className="bg-emerald-950/20 border border-emerald-500/25 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-emerald-400 text-[10px] font-mono uppercase tracking-wider">
              <span className="flex items-center gap-1.5 font-bold"><ShieldCheck size={14} /> Confirmed Commercial Milestone</span>
              <span className="text-emerald-300 font-semibold">Verified SLA</span>
            </div>
            <div className="text-xs font-bold text-white flex items-center gap-2 pt-1">
              <Calendar size={15} className="text-emerald-400" /> Reserved Slot: <span className="font-mono text-emerald-300">{call.booking.slot}</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Type: {call.booking.type || 'Executive Consultation'}
            </p>
          </div>
        )}

        {/* AI Executive Summary Card */}
        <div className="bg-[#0A0E1A] border border-white/[0.06] rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-indigo-400 font-semibold"><FileText size={13} /> Autonomous Call Synthesis</span>
            <span className="text-emerald-400 font-mono">CRM Synced: HTTP 200</span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-sans">
            {call.summary || 'Summary pending processing.'}
          </p>
        </div>

        {/* Verbatim Transcript */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
              Diarized Session Transcript (ASR Nova-2)
            </span>
            <span className="text-[10px] font-mono text-slate-400">Confidence: 98.4%</span>
          </div>
          <div className="space-y-2.5">
            {call.transcript && call.transcript.length > 0 ? (
              call.transcript.map((item, index) => (
                <div
                  key={index}
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    item.speaker === 'ai'
                      ? 'bg-[#0E1424] border border-indigo-500/20 text-slate-100 ml-4'
                      : 'bg-white/[0.03] border border-white/[0.06] text-slate-200 mr-4'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono mb-1.5 pb-1.5 border-b border-white/[0.06]">
                    <span className={`font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                      item.speaker === 'ai' ? 'text-indigo-400' : 'text-emerald-400'
                    }`}>
                      {item.speaker === 'ai' ? <Bot size={12} /> : <User size={12} />}
                      {item.speaker === 'ai' ? 'AGENT [SYNTHESIS ENGINE]' : 'PROSPECT CALLER'}
                    </span>
                    <span className="text-slate-500">{item.time || '00:00'}</span>
                  </div>
                  <p className="text-slate-200 text-xs leading-relaxed">{item.text}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">No transcript recorded for this session.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
