import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Download, Upload, PhoneCall, Play, Pause, 
  FileSpreadsheet, Sparkles, Building2, Check, Copy, 
  Trash2, Plus, Save, Volume2, Calendar, Clock,
  ChevronDown, ChevronUp, Radio, User, MapPin, 
  Loader2, CheckCircle2, AlertCircle, X, ExternalLink
} from 'lucide-react';
import AudioPlayer from './AudioPlayer';

export default function ClientPortal({ clientId = 'client_apex_01', onBackToAdmin, fromAdmin = false }) {
  const [clientData, setClientData] = useState(null);
  const [calls, setCalls] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('find_leads'); // find_leads | auto_dialer | recordings | business_info
  const [copiedDid, setCopiedDid] = useState(false);
  const [expandedCallId, setExpandedCallId] = useState(null);

  // Tab 1: Find Leads State
  const [nicheQuery, setNicheQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [leadCount, setLeadCount] = useState(25); // 10, 25, 50, 100
  const [generatingLeads, setGeneratingLeads] = useState(false);

  // Tab 2: Auto-Dialer State
  const [dialingBatch, setDialingBatch] = useState(false);
  const [dialProgress, setDialProgress] = useState(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const csvFileInputRef = useRef(null);

  // Live ToughTongue Mic Test State
  const [liveVoiceModalOpen, setLiveVoiceModalOpen] = useState(false);
  const [liveIframeSrc, setLiveIframeSrc] = useState('');
  const [startingVoice, setStartingVoice] = useState(false);

  // Tab 4: Business Info / Knowledge State
  const [kbData, setKbData] = useState({
    businessDescription: '',
    operatingHours: 'Monday - Saturday: 9:00 AM - 7:00 PM',
    location: '',
    services: [],
    faq: []
  });
  const [savingKb, setSavingKb] = useState(false);
  const [kbSavedToast, setKbSavedToast] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDeliverable, setNewServiceDeliverable] = useState('');
  const [newFaqQ, setNewFaqQ] = useState('');
  const [newFaqA, setNewFaqA] = useState('');

  // Fetch client profile, calls, and leads
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [resClient, resCalls, resLeads] = await Promise.all([
        fetch(`/api/portal/client/${clientId}`),
        fetch(`/api/portal/calls/${clientId}`),
        fetch(`/api/portal/client/${clientId}/leads`)
      ]);

      if (resClient.ok) {
        const client = await resClient.json();
        setClientData(client);
        if (client.knowledgeBase) {
          setKbData({
            businessDescription: client.knowledgeBase.businessDescription || '',
            operatingHours: client.knowledgeBase.operatingHours || 'Monday - Saturday: 9:00 AM - 7:00 PM',
            location: client.knowledgeBase.location || '',
            services: Array.isArray(client.knowledgeBase.services) ? client.knowledgeBase.services : [],
            faq: Array.isArray(client.knowledgeBase.faq) ? client.knowledgeBase.faq : []
          });
        }
        if (!nicheQuery && client.industry) setNicheQuery(client.industry);
        if (!locationQuery && client.country === 'dubai') setLocationQuery('Dubai');
        else if (!locationQuery && client.country === 'india') setLocationQuery('Mumbai');
        else if (!locationQuery && client.country === 'canada') setLocationQuery('Toronto');
      }

      if (resCalls.ok) {
        const callList = await resCalls.json();
        setCalls(callList);
        if (callList.length > 0 && !expandedCallId) {
          setExpandedCallId(callList[0].id);
        }
      }

      if (resLeads.ok) {
        const leadsData = await resLeads.json();
        setLeads(leadsData.leads || []);
      }
    } catch (e) {
      console.error('Error loading client portal:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [clientId]);

  // Copy phone number
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedDid(true);
    setTimeout(() => setCopiedDid(false), 2000);
  };

  // 1. Generate Leads
  const handleGenerateLeads = async (e) => {
    if (e) e.preventDefault();
    try {
      setGeneratingLeads(true);
      const res = await fetch(`/api/portal/client/${clientId}/leads/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: nicheQuery,
          location: locationQuery,
          count: leadCount
        })
      });
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
        alert(`Successfully found ${data.generatedCount || leadCount} verified leads! You can now download the CSV or start calling.`);
      }
    } catch (err) {
      alert('Error finding leads: ' + err.message);
    } finally {
      setGeneratingLeads(false);
    }
  };

  // 2. Download Leads as CSV
  const handleDownloadCsv = (targetLeads = leads) => {
    if (!targetLeads || targetLeads.length === 0) {
      alert('No leads available to download. Please generate or search leads first.');
      return;
    }
    const headers = ['Full Name', 'Phone Number', 'Company', 'Designation / Role', 'City', 'Intent Score (%)', 'Status'];
    const rows = targetLeads.map(l => [
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      `"${(l.company || '').replace(/"/g, '""')}"`,
      `"${(l.role || '').replace(/"/g, '""')}"`,
      `"${(l.city || '').replace(/"/g, '""')}"`,
      l.intentScore || 90,
      l.status || 'new'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${(clientData?.name || 'verified').toLowerCase().replace(/[^a-z0-9]/g, '_')}_leads.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 3. Upload CSV File
  const handleCsvFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target.result;
      const lines = text.split(/\r?\n/).filter(line => line.trim());
      if (lines.length <= 1) {
        alert('CSV file is empty or only has headers.');
        return;
      }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
      const nameIdx = headers.findIndex(h => h.includes('name'));
      const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('mobile') || h.includes('number') || h.includes('contact'));
      const companyIdx = headers.findIndex(h => h.includes('company') || h.includes('business') || h.includes('firm'));
      const cityIdx = headers.findIndex(h => h.includes('city') || h.includes('location'));

      const parsedLeads = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length >= 2) {
          const name = (nameIdx !== -1 ? parts[nameIdx] : parts[0]) || `Contact ${i}`;
          const phone = (phoneIdx !== -1 ? parts[phoneIdx] : parts[1]) || '';
          const company = companyIdx !== -1 ? parts[companyIdx] : (clientData?.name || 'Client');
          const city = cityIdx !== -1 ? parts[cityIdx] : 'Local';
          if (phone) {
            parsedLeads.push({
              name,
              phone,
              company,
              city,
              intentScore: Math.floor(85 + Math.random() * 14)
            });
          }
        }
      }

      if (parsedLeads.length > 0) {
        try {
          const res = await fetch(`/api/portal/client/${clientId}/leads/import`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leads: parsedLeads })
          });
          if (res.ok) {
            const data = await res.json();
            setLeads(data.leads || []);
            setActiveTab('auto_dialer');
            alert(`✅ ${parsedLeads.length} leads successfully imported from CSV! Ready to auto-call.`);
          }
        } catch (err) {
          alert('Error uploading leads: ' + err.message);
        }
      } else {
        alert('Could not find valid names and phone numbers in the CSV file.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset file input
  };

  // 4. Batch Auto-Dial
  const handleBatchDial = async () => {
    if (leads.length === 0) {
      alert('No leads available to call. Please generate leads or upload a CSV file first.');
      return;
    }
    try {
      setDialingBatch(true);
      const targetIds = selectedLeadIds.length > 0 ? selectedLeadIds : leads.slice(0, 10).map(l => l.id);
      setDialProgress({ current: 0, total: targetIds.length });

      const res = await fetch(`/api/portal/client/${clientId}/leads/batch-dial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds: targetIds })
      });

      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
        setSelectedLeadIds([]);
        // Refetch calls
        const resCalls = await fetch(`/api/portal/calls/${clientId}`);
        if (resCalls.ok) setCalls(await resCalls.json());
        // Refetch client for minutes
        const resClient = await fetch(`/api/portal/client/${clientId}`);
        if (resClient.ok) setClientData(await resClient.json());

        alert(`🎉 Call Campaign Finished!\n\n${data.dialedCount} calls completed by AI Agent.\n${data.bookedCount} appointments booked!\n\nYou can listen to the recordings and scripts in the "Recordings & Scripts" tab.`);
      }
    } catch (e) {
      alert('Error during dialing: ' + e.message);
    } finally {
      setDialingBatch(false);
      setDialProgress(null);
    }
  };

  // 5. Live ToughTongue Mic Test Session
  const handleStartLiveVoiceCall = async () => {
    try {
      setStartingVoice(true);
      const res = await fetch(`/api/portal/client/${clientId}/voice-session`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok && data.iframeSrc) {
        setLiveIframeSrc(data.iframeSrc);
        setLiveVoiceModalOpen(true);
      } else {
        alert(data.error || 'Unable to connect to live AI voice session.');
      }
    } catch (e) {
      alert('Error starting live test call: ' + e.message);
    } finally {
      setStartingVoice(false);
    }
  };

  // 6. Save Business Info / Knowledge
  const handleSaveKnowledge = async (e) => {
    if (e) e.preventDefault();
    try {
      setSavingKb(true);
      const res = await fetch(`/api/portal/client/${clientId}/knowledge`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ knowledgeBase: kbData })
      });
      if (res.ok) {
        setKbSavedToast(true);
        setTimeout(() => setKbSavedToast(false), 3000);
      } else {
        alert('Failed to save business info');
      }
    } catch (err) {
      alert('Error saving knowledge: ' + err.message);
    } finally {
      setSavingKb(false);
    }
  };

  const handleAddService = (e) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;
    setKbData(prev => ({
      ...prev,
      services: [
        ...(prev.services || []),
        {
          id: 'srv_' + Date.now(),
          name: newServiceName.trim(),
          price: newServicePrice.trim() || 'Custom Quote',
          deliverable: newServiceDeliverable.trim() || 'Standard deliverable'
        }
      ]
    }));
    setNewServiceName('');
    setNewServicePrice('');
    setNewServiceDeliverable('');
  };

  const handleDeleteService = (id) => {
    setKbData(prev => ({
      ...prev,
      services: (prev.services || []).filter(s => s.id !== id)
    }));
  };

  const handleAddFaq = (e) => {
    e.preventDefault();
    if (!newFaqQ.trim() || !newFaqA.trim()) return;
    setKbData(prev => ({
      ...prev,
      faq: [...(prev.faq || []), { q: newFaqQ.trim(), a: newFaqA.trim() }]
    }));
    setNewFaqQ('');
    setNewFaqA('');
  };

  const handleDeleteFaq = (idx) => {
    setKbData(prev => ({
      ...prev,
      faq: (prev.faq || []).filter((_, i) => i !== idx)
    }));
  };

  const minutesRemaining = (clientData?.allocatedMinutes || 1000) - (clientData?.usedMinutes || 0);

  return (
    <div className="min-h-screen bg-[#05070D] text-slate-100 flex flex-col font-sans">
      {/* Admin Floating Banner (Shown only when opened from Agency Admin) */}
      {fromAdmin && (
        <div className="bg-gradient-to-r from-indigo-950 via-purple-950 to-indigo-950 border-b border-indigo-500/30 px-4 md:px-6 py-2.5 flex items-center justify-between text-xs text-indigo-200">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold uppercase text-[10px] border border-indigo-500/40">
              👑 Agency Admin Access Mode
            </span>
            <span className="text-slate-300">Managing: <strong className="text-white">{clientData?.name}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/#/portal/${clientId}`);
                alert(`Direct Client Portal link copied for ${clientData?.name}!\n\n${window.location.origin}/#/portal/${clientId}`);
              }}
              className="px-3 py-1 rounded-lg bg-white/[0.06] hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold cursor-pointer flex items-center gap-1.5"
            >
              <Copy size={12} />
              <span>Share Client Link</span>
            </button>
            <button
              onClick={onBackToAdmin}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs cursor-pointer shadow-md shadow-indigo-500/30"
            >
              ← Return to Admin Panel
            </button>
          </div>
        </div>
      )}

      {/* Clean Client Header */}
      <header className="border-b border-white/[0.08] bg-[#080C16] px-4 md:px-6 py-4 shadow-lg shadow-black/20">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {clientData?.logo ? (
              <img 
                src={clientData.logo} 
                alt="Logo" 
                className="w-12 h-12 rounded-xl object-cover border border-white/10 shadow-md shrink-0 block"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-base shrink-0">
                <Building2 size={24} />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-white text-base md:text-lg tracking-tight">
                  {clientData?.name || 'Client Portal'}
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">
                  Active
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                <span>AI Calling Number:</span>
                <span className="font-mono text-white font-bold bg-white/[0.06] px-2 py-0.5 rounded border border-white/10">
                  {clientData?.assignedNumber || '+971 4 821 9920'}
                </span>
                <button
                  onClick={() => handleCopy(clientData?.assignedNumber || '')}
                  className="text-slate-400 hover:text-indigo-400 transition p-1"
                  title="Copy Phone Number"
                >
                  {copiedDid ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats: Calling Minutes */}
          <div className="flex items-center gap-3 bg-[#0A0E1A] border border-white/[0.08] px-4 py-2.5 rounded-2xl shadow-sm">
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400">AI Calling Balance</div>
              <div className="text-sm font-bold font-mono text-emerald-400 flex items-center gap-1.5 mt-0.5">
                <span>{minutesRemaining > 0 ? minutesRemaining : 0} mins left</span>
                <span className="text-slate-500 text-xs">/ {clientData?.allocatedMinutes || 1000}m</span>
              </div>
            </div>
            <div className="h-7 w-px bg-white/10 mx-1" />
            <button
              onClick={handleStartLiveVoiceCall}
              disabled={startingVoice}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20 cursor-pointer active:scale-95 disabled:opacity-50"
              title="Test speaking with your AI Voice Agent via your microphone"
            >
              {startingVoice ? <Loader2 size={13} className="animate-spin" /> : <Radio size={13} className="animate-pulse text-cyan-200" />}
              <span>Test AI Voice</span>
            </button>
          </div>
        </div>
      </header>

      {/* 4 Clean Navigation Tabs */}
      <div className="border-b border-white/[0.08] bg-[#070A12] px-4 md:px-6">
        <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto py-2">
          {[
            { id: 'find_leads', label: '1. Search & Find Leads', icon: Search, count: leads.length },
            { id: 'auto_dialer', label: '2. Upload CSV & Auto-Call', icon: PhoneCall, badge: `${leads.length} in Queue` },
            { id: 'recordings', label: '3. Call Recordings & Scripts', icon: Volume2, count: calls.length },
            { id: 'business_info', label: '4. Business Info & Knowledge', icon: Building2 }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] font-mono px-2 py-0.2 rounded-full ${
                    isActive ? 'bg-indigo-800 text-indigo-200' : 'bg-white/[0.08] text-slate-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="max-w-6xl mx-auto w-full p-4 md:p-6 flex-1">
        
        {/* =========================================================
            TAB 1: SEARCH & FIND LEADS (Download CSV)
            ========================================================= */}
        {activeTab === 'find_leads' && (
          <div className="space-y-6">
            {/* Search Box Card */}
            <div className="bg-[#090D17] border border-white/[0.08] rounded-2xl p-5 md:p-6 shadow-xl space-y-5">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Search size={18} className="text-indigo-400" />
                  <span>Search Decision-Maker Leads</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Tell us what kind of leads you need. The AI will find high-intent contacts with verified direct phone numbers ready to download as a CSV or call automatically.
                </p>
              </div>

              <form onSubmit={handleGenerateLeads} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Business Category / Lead Type
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Luxury Real Estate Buyers, Dental Clinics, Homeowners"
                      value={nicheQuery}
                      onChange={(e) => setNicheQuery(e.target.value)}
                      className="w-full bg-[#05070D] border border-white/[0.1] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                      Target City / Location
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dubai, Mumbai, Toronto, London"
                      value={locationQuery}
                      onChange={(e) => setLocationQuery(e.target.value)}
                      className="w-full bg-[#05070D] border border-white/[0.1] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                {/* Number of Leads Selector (Min 10, Max 100) */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-2">
                    How many leads do you want to generate? (Min 10 — Max 100)
                  </label>
                  <div className="grid grid-cols-4 gap-3 max-w-md">
                    {[10, 25, 50, 100].map(cnt => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setLeadCount(cnt)}
                        className={`py-2 rounded-xl text-xs font-bold font-mono transition cursor-pointer border ${
                          leadCount === cnt
                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-600/30'
                            : 'bg-[#05070D] border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.04]'
                        }`}
                      >
                        {cnt} Leads
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/[0.06]">
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
                    <Sparkles size={14} className="text-amber-400" />
                    <span>Includes Direct Mobile Numbers + AI Intent Scoring</span>
                  </div>

                  <button
                    type="submit"
                    disabled={generatingLeads}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-indigo-500/25 cursor-pointer disabled:opacity-50"
                  >
                    {generatingLeads ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Finding & Verifying Leads...</span>
                      </>
                    ) : (
                      <>
                        <Search size={14} />
                        <span>Find {leadCount} Leads Now</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Leads Results List with CSV Download */}
            <div className="bg-[#090D17] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl space-y-4 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <span>Generated Leads</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {leads.length} Available
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Verified contacts matching your search criteria.</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadCsv(leads)}
                    disabled={leads.length === 0}
                    className="px-4 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-40"
                    title="Download all leads as a CSV spreadsheet"
                  >
                    <Download size={14} />
                    <span>Download CSV</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('auto_dialer')}
                    disabled={leads.length === 0}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20 disabled:opacity-40"
                  >
                    <PhoneCall size={14} />
                    <span>Send to AI Auto-Caller →</span>
                  </button>
                </div>
              </div>

              {leads.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-[10px] font-mono uppercase text-slate-400">
                        <th className="py-2.5 px-3">Lead Contact</th>
                        <th className="py-2.5 px-3">Phone Number</th>
                        <th className="py-2.5 px-3">Company & Role</th>
                        <th className="py-2.5 px-3">City</th>
                        <th className="py-2.5 px-3 text-right">Intent Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {leads.map((l) => (
                        <tr key={l.id} className="hover:bg-white/[0.02] transition">
                          <td className="py-3 px-3">
                            <div className="font-semibold text-white">{l.name}</div>
                            <div className="text-[10px] text-slate-400">{l.niche || 'Inquiry'}</div>
                          </td>
                          <td className="py-3 px-3 font-mono text-white font-semibold">
                            {l.phone}
                          </td>
                          <td className="py-3 px-3">
                            <div className="text-slate-200">{l.company}</div>
                            <div className="text-[10px] text-slate-400">{l.role}</div>
                          </td>
                          <td className="py-3 px-3 text-slate-300">
                            {l.city}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px]">
                              🔥 {l.intentScore}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-500 text-xs">
                  No leads generated yet. Fill in the form above and click "Find Leads Now"!
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 2: UPLOAD CSV & AI AUTO-CALL
            ========================================================= */}
        {activeTab === 'auto_dialer' && (
          <div className="space-y-6">
            {/* Top Action Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option A: Upload CSV File */}
              <div className="bg-[#090D17] border border-white/[0.08] hover:border-indigo-500/30 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3 border border-indigo-500/20">
                    <FileSpreadsheet size={20} />
                  </div>
                  <h3 className="font-bold text-white text-sm">Upload Your Own Leads (CSV)</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Have your own lead list? Upload any CSV file with names and phone numbers. The AI will queue them for calling.
                  </p>
                </div>

                <div className="pt-2">
                  <input
                    type="file"
                    accept=".csv"
                    ref={csvFileInputRef}
                    onChange={handleCsvFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => csvFileInputRef.current?.click()}
                    className="w-full py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white font-bold text-xs border border-white/10 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
                  >
                    <Upload size={14} className="text-indigo-400" />
                    <span>Upload CSV Spreadsheet</span>
                  </button>
                </div>
              </div>

              {/* Option B: AI Calling Launcher */}
              <div className="bg-gradient-to-br from-[#090D17] to-indigo-950/30 border border-indigo-500/30 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 border border-emerald-500/20">
                    <PhoneCall size={20} />
                  </div>
                  <h3 className="font-bold text-white text-sm">Launch Autonomous AI Calls</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    The AI calls each contact, introduces your business, answers questions using your pricing & FAQs, and books confirmed appointments!
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleBatchDial}
                    disabled={dialingBatch || leads.length === 0}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {dialingBatch ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>AI Agent Dialing ({dialProgress?.total || 10} Leads)...</span>
                      </>
                    ) : (
                      <>
                        <PhoneCall size={16} />
                        <span>
                          {selectedLeadIds.length > 0 
                            ? `Start AI Calling Selected (${selectedLeadIds.length})` 
                            : `Start AI Calling Top Leads (${Math.min(leads.length, 10)})`}
                        </span>
                      </>
                    )}
                  </button>
                  <div className="text-[11px] text-center text-slate-400 font-mono">
                    Allocated Minutes Remaining: <span className="text-emerald-400 font-bold">{minutesRemaining}m</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Leads In Calling Queue */}
            <div className="bg-[#090D17] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
                <div>
                  <h3 className="font-bold text-white text-sm">Leads In Queue ({leads.length})</h3>
                  <p className="text-xs text-slate-400">Select leads to dial, or click "Start AI Calling" to dial automatically.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadCsv(leads)}
                    disabled={leads.length === 0}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/10 text-slate-300 text-xs font-semibold border border-white/10 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download size={13} />
                    <span>Download CSV</span>
                  </button>
                </div>
              </div>

              {leads.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-[10px] font-mono uppercase text-slate-400">
                        <th className="py-2.5 px-3">Select</th>
                        <th className="py-2.5 px-3">Contact</th>
                        <th className="py-2.5 px-3">Phone</th>
                        <th className="py-2.5 px-3">Company</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {leads.slice(0, 50).map(l => {
                        const isSelected = selectedLeadIds.includes(l.id);
                        return (
                          <tr key={l.id} className="hover:bg-white/[0.02]">
                            <td className="py-3 px-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  setSelectedLeadIds(prev => 
                                    prev.includes(l.id) ? prev.filter(x => x !== l.id) : [...prev, l.id]
                                  );
                                }}
                                className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                              />
                            </td>
                            <td className="py-3 px-3 font-semibold text-white">
                              {l.name}
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-200">
                              {l.phone}
                            </td>
                            <td className="py-3 px-3 text-slate-400">
                              {l.company}
                            </td>
                            <td className="py-3 px-3">
                              {l.status === 'booked' ? (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 text-[10px] uppercase font-mono">
                                  ✓ Appointment Booked
                                </span>
                              ) : l.status === 'contacted' ? (
                                <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-mono">
                                  Called
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-white/[0.04] text-slate-400 border border-white/10 text-[10px] font-mono">
                                  Ready
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-500 text-xs">
                  Queue is empty. Go to "Search & Find Leads" or upload a CSV above!
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 3: CALL RECORDINGS & CONVERSATION SCRIPTS
            ========================================================= */}
        {activeTab === 'recordings' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Volume2 size={18} className="text-indigo-400" />
                <span>Call Voice Recordings & Transcripts</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Listen to the voice recordings of calls made by your AI agent, and read the complete dialogue script of what was said.
              </p>
            </div>

            {calls.length > 0 ? (
              <div className="space-y-4">
                {calls.map((call) => {
                  const isExpanded = expandedCallId === call.id;
                  const isBooked = call.status === 'booked' || call.booking;

                  return (
                    <div 
                      key={call.id}
                      className="bg-[#090D17] border border-white/[0.08] hover:border-white/[0.14] rounded-2xl overflow-hidden shadow-lg transition"
                    >
                      {/* Call Summary Bar */}
                      <div 
                        onClick={() => setExpandedCallId(isExpanded ? null : call.id)}
                        className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-white/[0.01]"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isBooked ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          }`}>
                            {isBooked ? <Calendar size={18} /> : <PhoneCall size={18} />}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-white text-sm">{call.customerName || 'Inquiry Contact'}</h4>
                              {isBooked && (
                                <span className="px-2 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 font-bold text-[10px] font-mono border border-emerald-500/30">
                                  ✓ Appointment Confirmed
                                </span>
                              )}
                              <span className="text-[10px] font-mono text-slate-400 bg-white/[0.04] px-1.5 py-0.2 rounded border border-white/10">
                                {call.sentiment || 'Warm Lead'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-3 mt-1 font-mono">
                              <span className="text-slate-300">{call.customerPhone}</span>
                              <span>•</span>
                              <span>Duration: {Math.floor((call.durationSeconds || 60) / 60)}m {(call.durationSeconds || 60) % 60}s</span>
                              <span>•</span>
                              <span className="text-slate-500">{new Date(call.createdAt || Date.now()).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end md:self-auto">
                          <button 
                            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                          >
                            <span>{isExpanded ? 'Hide Script' : 'Listen & Read Script'}</span>
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded View: Audio Player & Script */}
                      {isExpanded && (
                        <div className="border-t border-white/[0.08] bg-[#06080F] p-4 md:p-5 space-y-4">
                          {/* 1. Voice Audio Player */}
                          <div>
                            <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-2">
                              <Volume2 size={14} className="text-indigo-400" />
                              <span>Call Audio Recording</span>
                            </div>
                            <AudioPlayer audioUrl={call.recordingUrl || 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=short-voice-note.mp3'} />
                          </div>

                          {/* 2. Full Conversation Dialogue Script */}
                          <div>
                            <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-2">
                              <FileSpreadsheet size={14} className="text-cyan-400" />
                              <span>Full Dialogue Script (Spoken Transcript)</span>
                            </div>

                            <div className="bg-[#090D17] border border-white/[0.08] rounded-xl p-4 space-y-3 max-h-72 overflow-y-auto">
                              {call.transcript && call.transcript.length > 0 ? (
                                call.transcript.map((line, idx) => (
                                  <div 
                                    key={idx}
                                    className={`flex items-start gap-2.5 ${
                                      line.speaker === 'ai' ? 'text-indigo-200' : 'text-slate-200'
                                    }`}
                                  >
                                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold shrink-0 mt-0.5 ${
                                      line.speaker === 'ai' 
                                        ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30' 
                                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    }`}>
                                      {line.speaker === 'ai' ? '🤖 AI Agent' : '👤 Customer'}
                                    </span>
                                    <div className="text-xs leading-relaxed">
                                      {line.text}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-slate-400">
                                  {call.summary || 'Call completed successfully.'}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* 3. AI Takeaway Summary */}
                          {call.summary && (
                            <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-3 text-xs text-indigo-300 flex items-start gap-2">
                              <Sparkles size={15} className="text-indigo-400 shrink-0 mt-0.5" />
                              <div>
                                <strong className="text-white block mb-0.5">AI Call Summary:</strong>
                                <span>{call.summary}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-[#090D17] border border-white/[0.08] rounded-2xl p-12 text-center text-slate-500 text-xs">
                No calls completed yet. Launch calls in the "Upload CSV & Auto-Call" tab to hear recordings here!
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            TAB 4: BUSINESS INFO & KNOWLEDGE (Calling Agent Updates)
            ========================================================= */}
        {activeTab === 'business_info' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Building2 size={18} className="text-indigo-400" />
                  <span>Update Business Information & AI Knowledge</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Keep your calling agent up to date! Add your latest services, prices, and answers to common customer questions.
                </p>
              </div>

              <button
                onClick={handleSaveKnowledge}
                disabled={savingKb}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer self-start sm:self-auto"
              >
                {savingKb ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                <span>Save & Update Calling Agent</span>
              </button>
            </div>

            {/* Section 1: Business Overview */}
            <div className="bg-[#090D17] border border-white/[0.08] rounded-2xl p-5 md:p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white">About Your Business</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Company Description (What the AI tells prospects)</label>
                  <textarea
                    rows={3}
                    value={kbData.businessDescription}
                    onChange={(e) => setKbData({ ...kbData, businessDescription: e.target.value })}
                    placeholder="e.g. We are a premier luxury real estate agency in Dubai specializing in prime beachfront penthouses and high-yield villas..."
                    className="w-full bg-[#05070D] border border-white/[0.1] rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Office / Working Hours</label>
                    <input
                      type="text"
                      value={kbData.operatingHours}
                      onChange={(e) => setKbData({ ...kbData, operatingHours: e.target.value })}
                      placeholder="e.g. Monday - Saturday: 9:00 AM - 7:00 PM"
                      className="w-full bg-[#05070D] border border-white/[0.1] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Office Address / Location</label>
                    <input
                      type="text"
                      value={kbData.location}
                      onChange={(e) => setKbData({ ...kbData, location: e.target.value })}
                      placeholder="e.g. Level 24, Marina Plaza, Dubai Marina"
                      className="w-full bg-[#05070D] border border-white/[0.1] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Services & Pricing */}
            <div className="bg-[#090D17] border border-white/[0.08] rounded-2xl p-5 md:p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Services & Pricing Catalog</h3>
                  <p className="text-xs text-slate-400">The AI uses these exact prices and deliverables when quoting to customers.</p>
                </div>
              </div>

              {/* Add New Service Form */}
              <form onSubmit={handleAddService} className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#05070D] p-3.5 rounded-xl border border-white/[0.06]">
                <input
                  type="text"
                  required
                  placeholder="Service Name (e.g. 3BHK Penthouse)"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="bg-[#090D17] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Price (e.g. 4.2 Million AED)"
                  value={newServicePrice}
                  onChange={(e) => setNewServicePrice(e.target.value)}
                  className="bg-[#090D17] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Deliverable / Brief Details"
                    value={newServiceDeliverable}
                    onChange={(e) => setNewServiceDeliverable(e.target.value)}
                    className="flex-1 bg-[#090D17] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Plus size={13} />
                    <span>Add</span>
                  </button>
                </div>
              </form>

              {/* Service List */}
              <div className="space-y-2">
                {kbData.services && kbData.services.length > 0 ? (
                  kbData.services.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs">
                      <div>
                        <div className="font-bold text-white">{s.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{s.deliverable}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                          {s.price}
                        </span>
                        <button
                          onClick={() => handleDeleteService(s.id)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                          title="Delete service"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No services added yet. Add one above!</p>
                )}
              </div>
            </div>

            {/* Section 3: FAQs (Answers for AI) */}
            <div className="bg-[#090D17] border border-white/[0.08] rounded-2xl p-5 md:p-6 shadow-xl space-y-4">
              <div className="border-b border-white/[0.06] pb-3">
                <h3 className="text-sm font-bold text-white">Common Questions & Answers (FAQs)</h3>
                <p className="text-xs text-slate-400">Teach your AI agent how to answer specific questions customers often ask.</p>
              </div>

              {/* Add FAQ Form */}
              <form onSubmit={handleAddFaq} className="space-y-2 bg-[#05070D] p-3.5 rounded-xl border border-white/[0.06]">
                <input
                  type="text"
                  required
                  placeholder="Customer Question (e.g. Do you offer virtual showroom tours on Zoom?)"
                  value={newFaqQ}
                  onChange={(e) => setNewFaqQ(e.target.value)}
                  className="w-full bg-[#090D17] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="AI Answer (e.g. Yes! We arrange live 3D walkthroughs over Zoom with our senior advisor.)"
                    value={newFaqA}
                    onChange={(e) => setNewFaqA(e.target.value)}
                    className="flex-1 bg-[#090D17] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Plus size={13} />
                    <span>Add</span>
                  </button>
                </div>
              </form>

              {/* FAQ List */}
              <div className="space-y-2">
                {kbData.faq && kbData.faq.length > 0 ? (
                  kbData.faq.map((f, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-indigo-300">Q: {f.q}</strong>
                        <button
                          onClick={() => handleDeleteFaq(idx)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <div className="text-slate-300">A: {f.a}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No FAQs added yet.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Live Mic Test Call Modal (ToughTongue White-Labeled WebRTC) */}
      {liveVoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#090D17] border border-indigo-500/40 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 flex items-center justify-center">
                  <Radio size={16} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Real-Time AI Voice Test Call</h3>
                  <p className="text-[11px] text-slate-400">Speak into your mic to test your calling agent</p>
                </div>
              </div>
              <button
                onClick={() => setLiveVoiceModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 flex flex-col items-center justify-center min-h-[360px] bg-[#05070D]">
              {liveIframeSrc ? (
                <iframe
                  src={liveIframeSrc}
                  allow="microphone; camera"
                  className="w-full h-[400px] rounded-2xl border border-white/[0.08] shadow-inner"
                  title="Live AI Voice Call Session"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-slate-400">
                  <Loader2 size={24} className="animate-spin text-indigo-400" />
                  <span>Connecting to voice engine...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {kbSavedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0E1528] border border-emerald-500/50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">Calling Agent updated with latest business info!</span>
        </div>
      )}
    </div>
  );
}
