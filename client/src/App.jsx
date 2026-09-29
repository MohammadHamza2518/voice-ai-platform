import React, { useState, useEffect } from 'react';
import SuperAdmin from './components/SuperAdmin';
import ClientPortal from './components/ClientPortal';
import { ArrowLeft, Radio, Building2, ChevronRight, ShieldCheck, Activity } from 'lucide-react';

export default function App() {
  const [route, setRoute] = useState('workspace'); // Default to friendly Client Portal
  const [selectedClientId, setSelectedClientId] = useState('client_apex_01');
  const [clients, setClients] = useState([]);

  // Fetch client directory
  const fetchClients = async () => {
    try {
      const res = await fetch('/api/admin/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(data);
        if (data.length > 0 && !selectedClientId) {
          setSelectedClientId(data[0].id);
        }
      }
    } catch (e) {
      console.error('Error loading client directory:', e);
    }
  };

  useEffect(() => {
    fetchClients();

    // Listen to hash changes for deep linking
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/admin')) {
        setRoute('admin');
      } else if (hash.startsWith('#/workspace/')) {
        const clientId = hash.replace('#/workspace/', '');
        setSelectedClientId(clientId);
        setRoute('workspace');
      } else {
        setRoute('workspace');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateToWorkspace = (clientId) => {
    setSelectedClientId(clientId);
    setRoute('workspace');
    window.location.hash = `#/workspace/${clientId}`;
  };

  const navigateToAdmin = () => {
    setRoute('admin');
    window.location.hash = '#/admin';
  };

  const activeClient = clients.find(c => c.id === selectedClientId) || clients[0];

  return (
    <div className="min-h-screen bg-[#05070D] flex flex-col font-sans text-slate-100">
      {/* Sleek Universal Top Bar (Clean & Professional) */}
      <header className="bg-[#080C16]/95 border-b border-white/[0.08] px-4 md:px-6 py-2.5 flex items-center justify-between text-xs sticky top-0 z-50 backdrop-blur-xl shadow-lg shadow-black/40">
        <div className="flex items-center gap-3 md:gap-5">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigateToWorkspace(selectedClientId)}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Radio size={16} className="animate-pulse" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-white tracking-tight flex items-center gap-1.5">
                <span>Aetheris</span>
                <span className="text-[10px] font-mono uppercase bg-indigo-500/10 text-indigo-400 px-1.5 py-0.2 rounded border border-indigo-500/20">Voice AI</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono hidden sm:block">Autonomous Calling & Lead OS</div>
            </div>
          </div>

          <div className="h-5 w-px bg-white/10 hidden md:block" />

          {/* Active Business Selector (Only in Workspace mode) */}
          {route === 'workspace' && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 hidden lg:inline">Active Business:</span>
              <div className="relative">
                <select
                  value={selectedClientId}
                  onChange={(e) => navigateToWorkspace(e.target.value)}
                  className="bg-[#0E1424] hover:bg-[#131B30] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-semibold focus:outline-none focus:border-indigo-500 transition cursor-pointer appearance-none pr-8 shadow-sm"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.country === 'india' ? '🇮🇳 ' : c.country === 'canada' ? '🇨🇦 ' : '🇦🇪 '} {c.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                  <ChevronRight size={12} className="rotate-90" />
                </div>
              </div>

              <span className="hidden xl:inline-flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>AI Agent Ready</span>
              </span>
            </div>
          )}
        </div>

        {/* Right Action: Clean View Switcher */}
        <div className="flex items-center gap-2.5">
          {route === 'workspace' ? (
            <button
              onClick={navigateToAdmin}
              className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              title="Open Agency Super Admin panel to add clients and manage global settings"
            >
              <Building2 size={13} className="text-indigo-400" />
              <span>Agency Admin Panel</span>
            </button>
          ) : (
            <button
              onClick={() => navigateToWorkspace(selectedClientId)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white border border-indigo-400/30 text-xs font-semibold transition-all flex items-center gap-2 shadow-md shadow-indigo-500/20 cursor-pointer"
              title="Go back to Client Business Calling & Lead View"
            >
              <ArrowLeft size={13} />
              <span>Back to Business View</span>
            </button>
          )}
        </div>
      </header>

      {/* Main View Render */}
      <div className="flex-1 flex flex-col">
        {route === 'admin' ? (
          <SuperAdmin 
            onSelectClientView={navigateToWorkspace} 
          />
        ) : (
          <ClientPortal 
            clientId={selectedClientId} 
            onBackToAdmin={navigateToAdmin}
          />
        )}
      </div>
    </div>
  );
}
