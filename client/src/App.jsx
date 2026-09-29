import React, { useState, useEffect } from 'react';
import SuperAdmin from './components/SuperAdmin';
import ClientPortal from './components/ClientPortal';
import { ArrowLeft, Radio, Building2, ChevronRight, ShieldCheck, Activity } from 'lucide-react';

export default function App() {
  const [route, setRoute] = useState('admin'); // 'admin' | 'workspace'
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
      if (hash.startsWith('#/workspace/')) {
        const clientId = hash.replace('#/workspace/', '');
        setSelectedClientId(clientId);
        setRoute('workspace');
      } else {
        setRoute('admin');
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
      {/* When in Workspace Mode: Show Sleek Enterprise Operator Command HUD */}
      {route === 'workspace' && (
        <div className="bg-[#080C16]/90 border-b border-white/[0.08] px-6 py-2.5 flex items-center justify-between text-xs sticky top-0 z-50 backdrop-blur-xl shadow-lg shadow-black/40">
          <div className="flex items-center gap-4">
            <button
              onClick={navigateToAdmin}
              className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-indigo-600 hover:text-white text-slate-200 border border-white/10 text-xs font-semibold transition-all duration-200 flex items-center gap-2 shadow-sm group"
              title="Return to Super Admin Operator Control Plane (Esc)"
            >
              <ArrowLeft size={13} className="text-slate-400 group-hover:text-white group-hover:-translate-x-0.5 transition-transform" />
              <span>Operator Cockpit</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono text-slate-400 group-hover:text-indigo-200 bg-black/30 rounded border border-white/10">ESC</kbd>
            </button>

            <div className="h-4 w-px bg-white/10" />

            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                Tenant Session Active
              </span>
              <span className="text-slate-400 text-xs flex items-center gap-1.5">
                <span>Inspecting:</span>
                <strong className="text-white font-semibold flex items-center gap-1.5">
                  <span>{activeClient?.country === 'india' ? '🇮🇳' : activeClient?.country === 'canada' ? '🇨🇦' : '🇦🇪'}</span>
                  {activeClient?.name}
                </strong>
              </span>
              <span className="text-slate-400 font-mono text-[11px] bg-white/[0.04] px-2 py-0.5 rounded border border-white/5 hidden lg:inline">
                {activeClient?.assignedNumber} • {activeClient?.carrier || 'Direct SIP Interconnect'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400 hidden md:inline">Switch Workspace:</span>
            <div className="relative">
              <select
                value={selectedClientId}
                onChange={(e) => navigateToWorkspace(e.target.value)}
                className="bg-[#0E1424] hover:bg-[#131B30] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium transition cursor-pointer appearance-none pr-8"
              >
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.country === 'india' ? '🇮🇳 India — ' : c.country === 'canada' ? '🇨🇦 Canada — ' : '🇦🇪 UAE — '} {c.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <ChevronRight size={12} className="rotate-90" />
              </div>
            </div>
          </div>
        </div>
      )}

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
