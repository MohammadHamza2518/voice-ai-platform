import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, PhoneIncoming, PhoneOutgoing, Calendar, Clock, 
  Search, Filter, ShieldCheck, Play, ChevronRight, Activity, 
  Flame, Sparkles, AlertCircle, RefreshCw, Download, Building2,
  Server, Zap, CheckCircle2, Shield, Radio, Globe, Copy, Check, ArrowUpRight,
  Camera, Upload, Image, X, BookOpen, Plus, Trash2, Edit3, MessageSquare,
  MapPin, Package, HelpCircle, Save, CheckCheck, Send,
  Users, UserPlus, Target, Database, CheckSquare, Square, FileSpreadsheet, Loader2
} from 'lucide-react';
import CallDrawer from './CallDrawer';
import RealDialpad from './RealDialpad';

export default function ClientPortal({ clientId = 'client_apex_01', onBackToAdmin }) {
  const [clientData, setClientData] = useState(null);
  const [calls, setCalls] = useState([]);
  const [selectedCall, setSelectedCall] = useState(null);
  const [activeTab, setActiveTab] = useState('calls'); // calls | appointments | leads | knowledge | dialer | telemetry
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiedDid, setCopiedDid] = useState(false);

  // DP (Logo / Profile Picture) Management State
  const [showDpModal, setShowDpModal] = useState(false);
  const [previewDp, setPreviewDp] = useState('');
  const [dpUrlInput, setDpUrlInput] = useState('');
  const [uploadingDp, setUploadingDp] = useState(false);
  const [dpSuccessMsg, setDpSuccessMsg] = useState(false);
  const fileInputRef = useRef(null);

  // Knowledge Base & Offerings Catalog State
  const [kbData, setKbData] = useState(null);
  const [savingKb, setSavingKb] = useState(false);
  const [kbSavedMsg, setKbSavedMsg] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDeliverable, setNewServiceDeliverable] = useState('');
  const [newFaqQ, setNewFaqQ] = useState('');
  const [newFaqA, setNewFaqA] = useState('');

  // AI Lead Finder & Prospecting Machine State
  const [leads, setLeads] = useState([]);
  const [leadStats, setLeadStats] = useState({ total: 0, highIntentCount: 0, bookedCount: 0, newCount: 0 });
  const [leadNicheInput, setLeadNicheInput] = useState('');
  const [leadLocationInput, setLeadLocationInput] = useState('');
  const [leadCountSelection, setLeadCountSelection] = useState(100);
  const [scrapingLeads, setScrapingLeads] = useState(false);
  const [scrapeStep, setScrapeStep] = useState(0); // 0: idle, 1: scanning, 2: validating carrier, 3: intent scoring, 4: complete
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [batchDialing, setBatchDialing] = useState(false);
  const [batchDialResult, setBatchDialResult] = useState(null);
  const [leadSearchQuery, setLeadSearchQuery] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState('all');
  const [callingLeadId, setCallingLeadId] = useState(null);

  // Fetch client profile and calls
  const fetchData = async () => {
    try {
      setLoading(true);
      const [resClient, resCalls] = await Promise.all([
        fetch(`/api/portal/client/${clientId}`),
        fetch(`/api/portal/calls/${clientId}?status=${statusFilter}&search=${searchQuery}`)
      ]);

      if (resClient.ok) {
        const client = await resClient.json();
        setClientData(client);
        if (client.knowledgeBase) {
          setKbData(client.knowledgeBase);
        }
      }
      if (resCalls.ok) {
        const callList = await resCalls.json();
        setCalls(callList);
      }
    } catch (err) {
      console.error('Error fetching portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKnowledge = async () => {
    if (!kbData) return;
    try {
      setSavingKb(true);
      const res = await fetch(`/api/portal/client/${clientId}/knowledge`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ knowledgeBase: kbData })
      });
      const data = await res.json();
      if (res.ok) {
        setKbSavedMsg(true);
        setTimeout(() => setKbSavedMsg(false), 2500);
      } else {
        alert(data.error || 'Failed to save knowledge base');
      }
    } catch (err) {
      alert('Error saving knowledge base: ' + err.message);
    } finally {
      setSavingKb(false);
    }
  };

  const handleAddService = (e) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;
    const newService = {
      id: 'srv_' + Date.now(),
      name: newServiceName.trim(),
      price: newServicePrice.trim() || 'Custom Quote',
      deliverable: newServiceDeliverable.trim() || 'Full service deliverable',
      duration: '45 mins'
    };
    setKbData(prev => ({
      ...prev,
      services: [...(prev?.services || []), newService]
    }));
    setNewServiceName('');
    setNewServicePrice('');
    setNewServiceDeliverable('');
  };

  const handleDeleteService = (serviceId) => {
    setKbData(prev => ({
      ...prev,
      services: (prev?.services || []).filter(s => s.id !== serviceId)
    }));
  };

  const handleAddFaq = (e) => {
    e.preventDefault();
    if (!newFaqQ.trim() || !newFaqA.trim()) return;
    const newFaq = {
      q: newFaqQ.trim(),
      a: newFaqA.trim()
    };
    setKbData(prev => ({
      ...prev,
      faq: [...(prev?.faq || []), newFaq]
    }));
    setNewFaqQ('');
    setNewFaqA('');
  };

  const handleDeleteFaq = (index) => {
    setKbData(prev => ({
      ...prev,
      faq: (prev?.faq || []).filter((_, i) => i !== index)
    }));
  };

  const fetchLeads = async () => {
    try {
      const res = await fetch(`/api/portal/client/${clientId}/leads`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
        setLeadStats({
          total: data.total || 0,
          highIntentCount: data.highIntentCount || 0,
          bookedCount: data.bookedCount || 0,
          newCount: data.newCount || 0
        });
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
    }
  };

  const handleGenerateLeads = async (e) => {
    if (e) e.preventDefault();
    try {
      setScrapingLeads(true);
      setScrapeStep(1); // Step 1: Scanning B2B directories
      setTimeout(() => setScrapeStep(2), 600); // Step 2: Validating Carrier Line Identification
      setTimeout(() => setScrapeStep(3), 1300); // Step 3: Intent Scoring & Deduplication

      const res = await fetch(`/api/portal/client/${clientId}/leads/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: leadNicheInput.trim() || clientData?.industry || 'High-Net-Worth Buyers',
          location: leadLocationInput.trim() || (clientData?.country === 'india' ? 'Mumbai' : clientData?.country === 'canada' ? 'Toronto' : 'Dubai'),
          count: leadCountSelection
        })
      });

      const data = await res.json();

      setTimeout(() => {
        setScrapeStep(4); // Complete
        if (res.ok) {
          fetchLeads();
          setTimeout(() => {
            setScrapingLeads(false);
            setScrapeStep(0);
          }, 1000);
        } else {
          setScrapingLeads(false);
          alert(data.error || 'Failed to generate leads');
        }
      }, 1900);
    } catch (err) {
      setScrapingLeads(false);
      alert('Error generating leads: ' + err.message);
    }
  };

  const handleDialSingleLead = async (lead) => {
    try {
      setCallingLeadId(lead.id);
      const res = await fetch('/api/portal/dial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          customerPhone: lead.phone,
          customerName: lead.name,
          purpose: `Speed-to-lead outbound follow-up for ${lead.company}`,
          direction: 'outbound'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'booked', lastCalledAt: new Date().toISOString() } : l));
        fetchData();
        fetchLeads();
        if (data.call) setSelectedCall(data.call);
      } else {
        alert(data.error || 'Failed to dial lead');
      }
    } catch (err) {
      alert('Error dialing lead: ' + err.message);
    } finally {
      setCallingLeadId(null);
    }
  };

  const handleBatchDial = async () => {
    const targetIds = selectedLeadIds.length > 0 
      ? selectedLeadIds 
      : leads.filter(l => l.status === 'new').slice(0, 10).map(l => l.id);

    if (targetIds.length === 0) {
      alert('Please select at least one lead to dial.');
      return;
    }

    try {
      setBatchDialing(true);
      const res = await fetch(`/api/portal/client/${clientId}/leads/batch-dial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadIds: targetIds })
      });
      const data = await res.json();
      if (res.ok) {
        setBatchDialResult(data);
        fetchData();
        fetchLeads();
        setSelectedLeadIds([]);
        setTimeout(() => setBatchDialResult(null), 5000);
      } else {
        alert(data.error || 'Failed to execute batch dial campaign');
      }
    } catch (err) {
      alert('Error during batch dial: ' + err.message);
    } finally {
      setBatchDialing(false);
    }
  };

  const handleExportCsv = () => {
    if (leads.length === 0) {
      alert('No leads available to export.');
      return;
    }
    const headers = ['Name', 'Phone', 'Email', 'Company', 'Role', 'City', 'Intent Score', 'Budget', 'Niche', 'Status', 'Source'];
    const rows = leads.map(l => [
      `"${l.name}"`,
      `"${l.phone}"`,
      `"${l.email}"`,
      `"${l.company}"`,
      `"${l.role}"`,
      `"${l.city}"`,
      `"${l.intentScore}%"`,
      `"${l.budget}"`,
      `"${l.niche}"`,
      `"${l.status}"`,
      `"${l.source}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leads_${clientId}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteLead = async (leadId) => {
    try {
      const res = await fetch(`/api/portal/client/${clientId}/leads/${leadId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchLeads();
      }
    } catch (err) {
      console.error('Error deleting lead:', err);
    }
  };

  const handleClearAllLeads = async () => {
    if (!window.confirm('Are you sure you want to clear all leads in this pipeline?')) return;
    try {
      const res = await fetch(`/api/portal/client/${clientId}/leads`, { method: 'DELETE' });
      if (res.ok) {
        fetchLeads();
        setSelectedLeadIds([]);
      }
    } catch (err) {
      console.error('Error clearing leads:', err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchLeads();
  }, [clientId, statusFilter, searchQuery]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedDid(true);
    setTimeout(() => setCopiedDid(false), 2000);
  };

  const handleOpenDpModal = () => {
    setPreviewDp(clientData?.logo || '');
    setDpUrlInput(clientData?.logo?.startsWith('http') ? clientData.logo : '');
    setShowDpModal(true);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert('File size exceeds 8MB. Please select a smaller photo.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewDp(reader.result);
        setDpUrlInput('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveDp = async () => {
    if (!previewDp) {
      alert('Please upload an image file or provide an image link.');
      return;
    }
    try {
      setUploadingDp(true);
      const res = await fetch(`/api/portal/client/${clientId}/logo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo: previewDp })
      });
      const data = await res.json();
      if (res.ok) {
        setClientData(prev => ({ ...prev, logo: data.logo }));
        setDpSuccessMsg(true);
        setTimeout(() => {
          setDpSuccessMsg(false);
          setShowDpModal(false);
        }, 900);
      } else {
        alert(data.error || 'Failed to update DP');
      }
    } catch (err) {
      alert('Error updating DP: ' + err.message);
    } finally {
      setUploadingDp(false);
    }
  };

  // Derived metrics
  const bookedCalls = calls.filter(c => c.status === 'booked');
  const conversionRate = calls.length > 0 
    ? Math.round((bookedCalls.length / calls.length) * 100) 
    : 0;

  const usagePercent = clientData?.allocatedMinutes 
    ? Math.min(100, Math.round(((clientData.usedMinutes || 0) / clientData.allocatedMinutes) * 100))
    : 0;

  const countryMeta = clientData?.country === 'india' 
    ? { flag: '🇮🇳', label: 'INDIA', badge: 'bg-orange-500/10 text-orange-300 border-orange-500/20' }
    : clientData?.country === 'canada'
    ? { flag: '🇨🇦', label: 'CANADA', badge: 'bg-rose-500/10 text-rose-300 border-rose-500/20' }
    : { flag: '🇦🇪', label: 'DUBAI', badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20' };

  return (
    <div className="min-h-screen bg-[#05070D] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-300">
      {/* Top White-Label Tenant Header */}
      <header className="border-b border-white/[0.08] bg-[#080C16]/90 px-6 py-4 sticky top-0 z-40 backdrop-blur-xl shadow-lg shadow-black/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Interactive DP (Display Picture) Avatar with Hover & Camera Trigger */}
            <div 
              onClick={handleOpenDpModal}
              className="relative group cursor-pointer"
              title="Click to change organization Profile Picture (DP) / Logo"
            >
              {clientData?.logo ? (
                <img 
                  src={clientData.logo} 
                  alt="Logo" 
                  className="w-13 h-13 rounded-2xl object-cover border border-white/10 shadow-md shrink-0 group-hover:brightness-75 transition-all"
                />
              ) : (
                <div className="w-13 h-13 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-base shrink-0 group-hover:bg-indigo-500/20 transition-all">
                  <Building2 size={24} />
                </div>
              )}
              {/* Hover Camera Overlay */}
              <div className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity border border-indigo-500/40 backdrop-blur-[2px]">
                <Camera size={16} />
                <span className="text-[8px] font-mono mt-0.5 font-bold uppercase tracking-wider">Edit DP</span>
              </div>
              {/* Bottom Right Badge */}
              <div className="absolute -bottom-1 -right-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full p-1 border-2 border-[#080C16] shadow-md group-hover:scale-110 transition-transform">
                <Camera size={10} />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${countryMeta.badge}`}>
                  <span>{countryMeta.flag}</span>
                  <span>{countryMeta.label}</span>
                </span>
                <h1 className="font-extrabold text-white text-base md:text-lg tracking-tight">
                  {clientData?.name || 'Tenant Workspace'}
                </h1>
                <button
                  onClick={handleOpenDpModal}
                  className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/20 flex items-center gap-1 transition-all cursor-pointer"
                  title="Upload or change organization DP / Logo"
                >
                  <Camera size={11} />
                  <span>Change DP</span>
                </button>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {clientData?.status || 'Active SLA'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] text-slate-400 border border-white/10 hidden sm:inline">
                  {clientData?.planTier || 'Enterprise Trunk'}
                </span>
              </div>

              <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2.5 mt-1">
                <div className="flex items-center gap-1.5 font-mono text-slate-300">
                  <span>E.164 Line:</span>
                  <span className="font-semibold text-white bg-white/[0.04] px-2 py-0.5 rounded border border-white/5">
                    {clientData?.assignedNumber || '+971 4 821 9920'}
                  </span>
                  <button
                    onClick={() => handleCopy(clientData?.assignedNumber || '')}
                    className="text-slate-500 hover:text-indigo-400 transition"
                    title="Copy E.164 Line"
                  >
                    {copiedDid ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  </button>
                </div>
                <span className="text-slate-600 hidden md:inline">•</span>
                <span className="text-slate-400 hidden md:inline">
                  Carrier: <span className="text-slate-200 font-medium">{clientData?.carrier || 'Direct SIP Interconnect'}</span>
                </span>
                <span className="text-slate-600 hidden md:inline">•</span>
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md ${
                  clientData?.country === 'india'
                    ? 'bg-orange-500/10 text-orange-300 border border-orange-500/20'
                    : clientData?.country === 'canada'
                    ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                    : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                }`}>
                  {clientData?.country === 'india' 
                    ? '🇮🇳 Natural Hinglish Engine' 
                    : clientData?.country === 'canada' 
                    ? '🇨🇦 Canadian English Engine' 
                    : '🇦🇪 Dubai Executive Engine'}
                </span>
              </div>
            </div>
          </div>

          {/* Calling Minutes Meter */}
          <div className="bg-[#0A0E1A] border border-white/[0.08] rounded-2xl px-5 py-3 min-w-[280px] shadow-lg shadow-black/20">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400 font-mono uppercase text-[10px] tracking-wider font-semibold">
                Billable Minutes Pool
              </span>
              <span className="font-mono text-white font-bold text-xs">
                {clientData?.usedMinutes || 0} / {clientData?.allocatedMinutes || 1000} mins
              </span>
            </div>
            <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  usagePercent > 85 ? 'bg-amber-400' : 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                }`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-1.5">
              <span>{clientData?.remainingMinutes || 0} mins unbilled</span>
              <span className="font-semibold text-slate-300">{usagePercent}% utilized</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full p-6 space-y-6 flex-1">
        {/* MNC Telephony KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative overflow-hidden bg-[#0A0E1A]/80 border border-white/[0.08] hover:border-indigo-500/40 rounded-2xl p-5 shadow-xl transition-all duration-300 hover:-translate-y-0.5 group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                Telephony Sessions (Total)
              </span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Phone size={16} />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-3">
              <span className="text-3xl font-extrabold text-white tracking-tight">{calls.length}</span>
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 font-mono">
                <Activity size={12} /> 100% Captured
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-mono">
              Inbound & Outbound CDR Audio Stream
            </p>
          </div>

          <div className="relative overflow-hidden bg-[#0A0E1A]/80 border border-white/[0.08] hover:border-emerald-500/40 rounded-2xl p-5 shadow-xl transition-all duration-300 hover:-translate-y-0.5 group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                Commercial Appointments
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Calendar size={16} />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-3">
              <span className="text-3xl font-extrabold text-emerald-400 tracking-tight">{bookedCalls.length}</span>
              <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/20 font-bold">
                High Value
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-mono">
              Conversion: <span className="text-emerald-400 font-semibold">{conversionRate}% of leads</span>
            </p>
          </div>

          <div className="relative overflow-hidden bg-[#0A0E1A]/80 border border-white/[0.08] hover:border-cyan-500/40 rounded-2xl p-5 shadow-xl transition-all duration-300 hover:-translate-y-0.5 group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                Speed-to-Lead Response
              </span>
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Zap size={16} />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-3">
              <span className="text-3xl font-extrabold text-cyan-400 tracking-tight font-mono">28s</span>
              <span className="text-xs text-slate-400 font-mono">Target: &lt;60s</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-mono">
              Instant outbound trigger on web lead
            </p>
          </div>

          <div className="relative overflow-hidden bg-[#0A0E1A]/80 border border-white/[0.08] hover:border-purple-500/40 rounded-2xl p-5 shadow-xl transition-all duration-300 hover:-translate-y-0.5 group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                Voice Latency (P99)
              </span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Radio size={16} />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-3">
              <span className="text-3xl font-extrabold text-white tracking-tight font-mono">412ms</span>
              <span className="text-xs text-emerald-400 font-mono font-semibold">Ultra-Low Jitter</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-mono">
              Sub-500ms conversational turn-taking
            </p>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div className="bg-[#0A0E1A] p-1.5 rounded-2xl border border-white/[0.08] inline-flex items-center gap-1.5 shadow-inner">
            {[
              { id: 'calls', label: 'Call Detail Records (CDR)', count: calls.length },
              { id: 'appointments', label: 'Verified Appointments', count: bookedCalls.length },
              { id: 'leads', label: 'AI Lead Finder (Prospector)', count: leads.length },
              { id: 'knowledge', label: 'AI Brain & Services' },
              { id: 'dialer', label: 'Telephony Terminal' },
              { id: 'telemetry', label: 'Trunk & CRM Health' },
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/25 border border-indigo-400/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                      isActive ? 'bg-white/20 text-white' : 'bg-white/[0.06] text-slate-400'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={fetchData}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] transition shadow-sm cursor-pointer self-end sm:self-auto"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-indigo-400' : ''} />
            <span>Refresh Feed</span>
          </button>
        </div>

        {/* TAB 1: CALLS & RECORDINGS TABLE */}
        {activeTab === 'calls' && (
          <div className="space-y-4">
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search size={14} className="absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by customer name, phone number, or notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0A0E1A] border border-white/[0.08] rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 bg-[#0A0E1A] border border-white/[0.08] p-1.5 rounded-xl self-start sm:self-auto">
                {[
                  { id: 'all', label: 'All Calls' },
                  { id: 'booked', label: 'Confirmed Visits' },
                  { id: 'callback', label: 'Callbacks' },
                  { id: 'unqualified', label: 'General Inquiries' }
                ].map(st => (
                  <button
                    key={st.id}
                    onClick={() => setStatusFilter(st.id)}
                    className={`text-[11px] font-medium px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      statusFilter === st.id
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="bg-[#090D17]/90 border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.02] text-slate-400 font-semibold border-b border-white/[0.06] uppercase text-[10px] font-mono tracking-wider">
                    <tr>
                      <th className="py-4 px-5">Direction</th>
                      <th className="py-4 px-5">Customer Contact</th>
                      <th className="py-4 px-5">Duration</th>
                      <th className="py-4 px-5">Outcome Status</th>
                      <th className="py-4 px-5">AI Key Summary</th>
                      <th className="py-4 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {calls.map((call) => (
                      <tr 
                        key={call.id}
                        onClick={() => setSelectedCall(call)}
                        className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                      >
                        {/* Direction */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-2.5">
                            <span className={`p-2 rounded-xl ${
                              call.direction === 'inbound'
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {call.direction === 'inbound' ? <PhoneIncoming size={13} /> : <PhoneOutgoing size={13} />}
                            </span>
                            <span className="capitalize font-semibold text-slate-300">{call.direction}</span>
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="py-4 px-5">
                          <div className="font-bold text-white group-hover:text-indigo-300 transition">
                            {call.customerName || 'Direct Prospect'}
                          </div>
                          <div className="font-mono text-slate-400 text-[11px] mt-0.5">{call.customerPhone}</div>
                        </td>

                        {/* Duration */}
                        <td className="py-4 px-5 font-mono text-slate-300">
                          {Math.floor(call.durationSeconds / 60)}m {call.durationSeconds % 60}s
                        </td>

                        {/* Outcome Status */}
                        <td className="py-4 px-5">
                          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                            call.status === 'booked'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : call.status === 'callback'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : 'bg-white/[0.04] text-slate-400 border-white/10'
                          }`}>
                            {call.status === 'booked' ? '✓ Appointment Set' : call.status}
                          </span>
                        </td>

                        {/* AI Summary Preview */}
                        <td className="py-4 px-5 max-w-md">
                          <p className="text-slate-300 line-clamp-1 group-hover:text-white transition leading-relaxed">
                            {call.summary}
                          </p>
                        </td>

                        {/* Action Button */}
                        <td className="py-4 px-5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCall(call);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-indigo-600 hover:text-white text-slate-200 border border-white/10 text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ml-auto shadow-sm cursor-pointer"
                          >
                            <Play size={12} fill="currentColor" />
                            <span>Review Call</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {calls.length === 0 && (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-slate-500 text-xs">
                          No call detail records found matching your filter criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VERIFIED APPOINTMENTS */}
        {activeTab === 'appointments' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {bookedCalls.map(call => (
              <div 
                key={call.id}
                className="bg-[#090D17]/90 border border-white/[0.08] hover:border-emerald-500/40 rounded-2xl p-6 shadow-xl transition-all duration-200 space-y-4 backdrop-blur-xl group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
                      ✓ Confirmed Tele-Booking
                    </span>
                    <h3 className="text-base font-bold text-white mt-2.5 group-hover:text-emerald-300 transition">
                      {call.customerName}
                    </h3>
                    <p className="text-xs font-mono text-slate-400">{call.customerPhone}</p>
                  </div>
                  <button
                    onClick={() => setSelectedCall(call)}
                    className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-emerald-500 hover:text-slate-950 text-slate-300 border border-white/10 transition-all cursor-pointer shadow-sm"
                    title="Listen to Audio Proof"
                  >
                    <Play size={14} fill="currentColor" />
                  </button>
                </div>

                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase font-semibold text-slate-400 block">Scheduled Time Slot</span>
                    <span className="text-xs font-bold text-white">{call.booking?.slot || 'Confirmed Slot'}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-[#06080F] p-3.5 rounded-xl border border-white/[0.04]">
                  {call.summary}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-white/[0.06] font-mono">
                  <span>Call Duration: {Math.floor(call.durationSeconds / 60)}m {call.durationSeconds % 60}s</span>
                  <button
                    onClick={() => setSelectedCall(call)}
                    className="text-emerald-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    Audio Proof & Transcript <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB: AI LEAD FINDER & PROSPECTING MACHINE */}
        {activeTab === 'leads' && (
          <div className="space-y-6">
            {/* Header & Metric Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#090D17]/90 border border-white/[0.08] rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Total Scraped Leads</span>
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Users size={16} />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold text-white font-mono">{leads.length}</span>
                  <span className="text-xs text-indigo-400 font-mono">100% Enriched</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2 font-mono">Directory & Maps Verified</p>
              </div>

              <div className="bg-[#090D17]/90 border border-white/[0.08] rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">High-Intent Leads (&gt;90%)</span>
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Flame size={16} />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold text-amber-400 font-mono">{leadStats.highIntentCount}</span>
                  <span className="text-xs text-amber-300 font-mono">Hot Buyers</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2 font-mono">High purchase probability</p>
              </div>

              <div className="bg-[#090D17]/90 border border-white/[0.08] rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">AI Converted / Booked</span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Calendar size={16} />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold text-emerald-400 font-mono">{leadStats.bookedCount}</span>
                  <span className="text-xs text-emerald-300 font-mono">Slot Confirmed</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2 font-mono">Tele-appointments locked</p>
              </div>

              <div className="bg-[#090D17]/90 border border-white/[0.08] rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Ready to Dial (New)</span>
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Zap size={16} />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className="text-3xl font-extrabold text-cyan-400 font-mono">{leadStats.newCount}</span>
                  <span className="text-xs text-cyan-300 font-mono">Untouched</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2 font-mono">Queued for AI Agent</p>
              </div>
            </div>

            {/* Scraping & Lead Generator Form */}
            <div className="bg-[#090D17]/90 border border-white/[0.08] rounded-2xl p-6 shadow-xl backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-white/[0.06]">
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                      <Target size={16} />
                    </span>
                    <span>AI Lead Finder & Local Directory Scraper</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                    Tell the AI what business niche, buyer persona, and territory to search. The crawler queries commercial directories, Google Maps business packs, and active registries to deliver verified E.164 phone numbers.
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 self-start md:self-auto flex items-center gap-1.5">
                  <Sparkles size={12} />
                  <span>Enrichment Engine: 99.4% Validated</span>
                </span>
              </div>

              <form onSubmit={handleGenerateLeads} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">
                      Target Niche / Industry Keyword
                    </label>
                    <input
                      type="text"
                      placeholder={clientData?.industry ? `e.g. ${clientData.industry} Buyers / Clinics` : 'e.g. Off-Plan Luxury Villa Investors'}
                      value={leadNicheInput}
                      onChange={(e) => setLeadNicheInput(e.target.value)}
                      disabled={scrapingLeads}
                      className="w-full bg-[#06080F] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">
                      Target City / Territory
                    </label>
                    <input
                      type="text"
                      placeholder={clientData?.country === 'india' ? 'e.g. Mumbai (Bandra & South)' : clientData?.country === 'canada' ? 'e.g. Toronto (Yorkville & Downtown)' : 'e.g. Dubai (Marina & Downtown)'}
                      value={leadLocationInput}
                      onChange={(e) => setLeadLocationInput(e.target.value)}
                      disabled={scrapingLeads}
                      className="w-full bg-[#06080F] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">
                      Lead Volume
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[25, 50, 100, 250].map((num) => (
                        <button
                          key={num}
                          type="button"
                          disabled={scrapingLeads}
                          onClick={() => setLeadCountSelection(num)}
                          className={`py-2 px-1 rounded-xl text-xs font-mono font-bold transition border cursor-pointer ${
                            leadCountSelection === num
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                              : 'bg-[#06080F] text-slate-400 border-white/[0.06] hover:text-white'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
                    <Database size={13} className="text-cyan-400" />
                    <span>Selected: <strong className="text-white">{leadCountSelection} Verified Leads</strong> with Direct Phone Numbers</span>
                  </div>

                  <button
                    type="submit"
                    disabled={scrapingLeads}
                    className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-600 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-extrabold px-6 py-3 rounded-xl transition-all shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 text-xs active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {scrapingLeads ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Scraping & Enriching Pipeline...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={16} />
                        <span>Scrape & Enrich {leadCountSelection} Leads Now</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Scrape Progress Animation Modal / Bar */}
              {scrapingLeads && (
                <div className="mt-5 p-4 rounded-xl bg-[#06080F] border border-cyan-500/30 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-cyan-300 font-bold flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                      </span>
                      Live AI Prospecting Engine Active
                    </span>
                    <span className="text-slate-400 font-semibold">Stage {scrapeStep} of 4</span>
                  </div>

                  <div className="space-y-1.5 text-xs font-mono">
                    <div className={`flex items-center gap-2 transition-all ${scrapeStep >= 1 ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                      <span>{scrapeStep >= 1 ? '✓' : '○'}</span>
                      <span>1. Querying Google Maps local packs & B2B trade registries...</span>
                    </div>
                    <div className={`flex items-center gap-2 transition-all ${scrapeStep >= 2 ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                      <span>{scrapeStep >= 2 ? '✓' : '○'}</span>
                      <span>2. Validating E.164 telecom carrier line identification & STIR/SHAKEN Level A...</span>
                    </div>
                    <div className={`flex items-center gap-2 transition-all ${scrapeStep >= 3 ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                      <span>{scrapeStep >= 3 ? '✓' : '○'}</span>
                      <span>3. Calculating AI Intent Scoring & budget qualification filters...</span>
                    </div>
                    <div className={`flex items-center gap-2 transition-all ${scrapeStep >= 4 ? 'text-cyan-400 font-bold' : 'text-slate-500'}`}>
                      <span>{scrapeStep >= 4 ? '✓' : '○'}</span>
                      <span>4. Finalizing and loading {leadCountSelection} verified leads into client CRM queue!</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Batch Dial Result Alert */}
            {batchDialResult && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs text-emerald-300 animate-in fade-in">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                  <div>
                    <strong className="text-white block">{batchDialResult.message}</strong>
                    <span className="text-emerald-400/80">
                      Recordings and transcripts have been generated and synced to the Call Detail Records (CDR) tab.
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setBatchDialResult(null)}
                  className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Leads Table Management */}
            <div className="bg-[#090D17]/90 border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-4">
              {/* Table Toolbar */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
                <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-xl">
                  {/* Search */}
                  <div className="relative flex-1 min-w-[200px]">
                    <Search size={14} className="absolute left-3.5 top-3 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search leads by name, phone, company, or city..."
                      value={leadSearchQuery}
                      onChange={(e) => setLeadSearchQuery(e.target.value)}
                      className="w-full bg-[#06080F] border border-white/[0.08] rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1 bg-[#06080F] p-1 rounded-xl border border-white/[0.06]">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'new', label: 'New' },
                      { id: 'booked', label: 'Booked' },
                      { id: 'hot', label: 'Hot (>90%)' }
                    ].map(f => (
                      <button
                        key={f.id}
                        onClick={() => setLeadStatusFilter(f.id)}
                        className={`text-[11px] font-mono px-2.5 py-1 rounded-lg transition cursor-pointer ${
                          leadStatusFilter === f.id
                            ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Batch Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleBatchDial}
                    disabled={batchDialing || leads.length === 0}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer disabled:opacity-40"
                    title="Launch autonomous outbound AI calls to selected leads"
                  >
                    {batchDialing ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>AI Dialing Batch...</span>
                      </>
                    ) : (
                      <>
                        <PhoneCall size={13} />
                        <span>
                          {selectedLeadIds.length > 0 
                            ? `Auto-Dial Selected (${selectedLeadIds.length})` 
                            : 'Auto-Dial Top 10 New Leads'}
                        </span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleExportCsv}
                    disabled={leads.length === 0}
                    className="bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                    title="Export pipeline to CSV"
                  >
                    <FileSpreadsheet size={13} className="text-emerald-400" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    onClick={handleClearAllLeads}
                    disabled={leads.length === 0}
                    className="bg-white/[0.04] hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-white/[0.08] hover:border-rose-500/20 px-2.5 py-2 rounded-xl text-xs transition cursor-pointer"
                    title="Clear pipeline"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Filtered Leads List */}
              {(() => {
                const filteredLeads = leads.filter(l => {
                  if (leadStatusFilter === 'new' && l.status !== 'new') return false;
                  if (leadStatusFilter === 'booked' && l.status !== 'booked') return false;
                  if (leadStatusFilter === 'hot' && l.intentScore < 90) return false;
                  if (leadSearchQuery) {
                    const q = leadSearchQuery.toLowerCase();
                    return (
                      l.name?.toLowerCase().includes(q) ||
                      l.phone?.includes(q) ||
                      l.company?.toLowerCase().includes(q) ||
                      l.city?.toLowerCase().includes(q) ||
                      l.role?.toLowerCase().includes(q)
                    );
                  }
                  return true;
                });

                const allSelected = filteredLeads.length > 0 && filteredLeads.every(l => selectedLeadIds.includes(l.id));

                const toggleSelectAll = () => {
                  if (allSelected) {
                    setSelectedLeadIds([]);
                  } else {
                    setSelectedLeadIds(filteredLeads.map(l => l.id));
                  }
                };

                const toggleSelectLead = (id) => {
                  setSelectedLeadIds(prev => 
                    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                  );
                };

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/[0.08] text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                          <th className="py-3 px-3 w-10">
                            <button
                              type="button"
                              onClick={toggleSelectAll}
                              className="text-slate-400 hover:text-white transition cursor-pointer"
                            >
                              {allSelected ? <CheckSquare size={14} className="text-cyan-400" /> : <Square size={14} />}
                            </button>
                          </th>
                          <th className="py-3 px-3">Lead & Decision Maker</th>
                          <th className="py-3 px-3">Contact & Phone</th>
                          <th className="py-3 px-3">Company & City</th>
                          <th className="py-3 px-3">Budget Target</th>
                          <th className="py-3 px-3">Intent Quality</th>
                          <th className="py-3 px-3">Status</th>
                          <th className="py-3 px-3 text-right">Instant AI Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04] text-xs">
                        {filteredLeads.length > 0 ? (
                          filteredLeads.map(lead => {
                            const isSelected = selectedLeadIds.includes(lead.id);
                            const isCallingThis = callingLeadId === lead.id;

                            return (
                              <tr
                                key={lead.id}
                                className={`hover:bg-white/[0.02] transition group ${isSelected ? 'bg-cyan-500/[0.04]' : ''}`}
                              >
                                <td className="py-3.5 px-3">
                                  <button
                                    type="button"
                                    onClick={() => toggleSelectLead(lead.id)}
                                    className="text-slate-400 hover:text-white transition cursor-pointer"
                                  >
                                    {isSelected ? <CheckSquare size={14} className="text-cyan-400" /> : <Square size={14} />}
                                  </button>
                                </td>

                                <td className="py-3.5 px-3">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center font-bold text-white text-xs shrink-0">
                                      {lead.name?.charAt(0)}
                                    </div>
                                    <div>
                                      <span className="font-bold text-white block group-hover:text-cyan-300 transition">
                                        {lead.name}
                                      </span>
                                      <span className="text-[10px] text-slate-400 block font-mono">
                                        {lead.role}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                <td className="py-3.5 px-3">
                                  <div>
                                    <span className="font-mono text-cyan-300 font-semibold block text-xs">
                                      {lead.phone}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block font-mono truncate max-w-[150px]">
                                      {lead.email}
                                    </span>
                                  </div>
                                </td>

                                <td className="py-3.5 px-3">
                                  <div>
                                    <span className="font-semibold text-slate-200 block text-xs">
                                      {lead.company}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block flex items-center gap-1 font-mono">
                                      <MapPin size={10} className="text-slate-500" />
                                      {lead.city}
                                    </span>
                                  </div>
                                </td>

                                <td className="py-3.5 px-3">
                                  <span className="font-mono font-bold text-slate-200 text-xs bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.04]">
                                    {lead.budget}
                                  </span>
                                </td>

                                <td className="py-3.5 px-3">
                                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 w-fit ${
                                    lead.intentScore >= 90
                                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/25'
                                      : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/25'
                                  }`}>
                                    {lead.intentScore >= 90 && <Flame size={10} />}
                                    <span>{lead.intentScore}% Intent</span>
                                  </span>
                                </td>

                                <td className="py-3.5 px-3">
                                  <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border inline-block ${
                                    lead.status === 'booked'
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                                      : lead.status === 'contacted'
                                      ? 'bg-blue-500/10 text-blue-300 border-blue-500/25'
                                      : 'bg-white/[0.04] text-slate-400 border-white/[0.08]'
                                  }`}>
                                    {lead.status === 'booked' ? '✓ Booked' : lead.status === 'contacted' ? 'Contacted' : 'New Lead'}
                                  </span>
                                </td>

                                <td className="py-3.5 px-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => handleDialSingleLead(lead)}
                                      disabled={isCallingThis}
                                      className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/30 px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
                                      title={`Dispatch AI Speed-to-lead call to ${lead.phone}`}
                                    >
                                      {isCallingThis ? (
                                        <Loader2 size={12} className="animate-spin" />
                                      ) : (
                                        <PhoneCall size={12} />
                                      )}
                                      <span>{isCallingThis ? 'Dialing...' : 'AI Dial'}</span>
                                    </button>

                                    <button
                                      onClick={() => handleDeleteLead(lead.id)}
                                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition cursor-pointer"
                                      title="Remove lead"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="8" className="py-12 text-center text-slate-500 text-xs">
                              No leads found matching your criteria. Click "Scrape & Enrich Leads Now" to populate.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* TAB 3: SPEED DIALER */}
        {activeTab === 'dialer' && (
          <div className="flex justify-center py-6">
            <RealDialpad 
              clientId={clientId} 
              onCallCompleted={(newCall) => {
                fetchData();
                if (newCall) setSelectedCall(newCall);
              }} 
            />
          </div>
        )}

        {/* TAB 4: CARRIER TRUNK & CRM TELEMETRY */}
        {activeTab === 'telemetry' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Carrier Interconnect Card */}
              <div className="bg-[#090D17]/90 border border-white/[0.08] rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      <Radio size={16} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-xs uppercase font-mono tracking-wider">SIP Carrier Trunk</h3>
                      <p className="text-[11px] text-slate-400">Direct Telecom Interconnect</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    CONNECTED
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                    <span className="text-slate-400">Carrier Provider</span>
                    <span className="font-semibold text-white">{clientData?.carrier || 'e& Direct Trunk'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                    <span className="text-slate-400">DID E.164 Routing</span>
                    <span className="font-mono text-cyan-400 font-semibold">{clientData?.assignedNumber || '+971 4 821 9920'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                    <span className="text-slate-400">STIR/SHAKEN Attestation</span>
                    <span className="font-mono text-emerald-400 font-bold flex items-center gap-1">
                      <Shield size={12} /> Level A (Signed)
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                    <span className="text-slate-400">SIP Signaling Latency</span>
                    <span className="font-mono text-white">{clientData?.sipTrunkStatus || 'Operational (38ms)'}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">Audio Codec</span>
                    <span className="font-mono text-slate-300">G.711u / Opus HD 48kHz</span>
                  </div>
                </div>
              </div>

              {/* Speech Synthesis & Model Engine */}
              <div className="bg-[#090D17]/90 border border-white/[0.08] rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <Zap size={16} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-xs uppercase font-mono tracking-wider">Voice Orchestrator</h3>
                      <p className="text-[11px] text-slate-400">Sub-500ms Audio Pipeline</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold">
                    LOW JITTER
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                    <span className="text-slate-400">Language Mode</span>
                    <span className="font-semibold text-white">
                      {clientData?.country === 'india' 
                        ? 'Natural Urban Hinglish' 
                        : clientData?.country === 'canada' 
                        ? 'Canadian English (GTA/Metro)' 
                        : 'Executive International English'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                    <span className="text-slate-400">Speech-To-Text (ASR)</span>
                    <span className="font-mono text-white">Deepgram Nova-2 (WER &lt; 2.1%)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                    <span className="text-slate-400">Voice Synthesis (TTS)</span>
                    <span className="font-mono text-white">Cartesia Sonic / ElevenLabs P99</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                    <span className="text-slate-400">First-Audio Turnaround</span>
                    <span className="font-mono text-emerald-400 font-bold">412ms</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">Inbound Overflow Fallback</span>
                    <span className="font-mono text-slate-300">Carrier PSTN Forwarding</span>
                  </div>
                </div>
              </div>

              {/* Enterprise CRM Sync */}
              <div className="bg-[#090D17]/90 border border-white/[0.08] rounded-2xl p-5 space-y-4 shadow-xl backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Server size={16} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-xs uppercase font-mono tracking-wider">CRM Telemetry Bridge</h3>
                      <p className="text-[11px] text-slate-400">Automated Pipeline Dispatches</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    SYNCED
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                    <span className="text-slate-400">Target Integration</span>
                    <span className="font-semibold text-emerald-400">{clientData?.crmIntegration || 'HubSpot Enterprise'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                    <span className="text-slate-400">Webhook Delivery SLA</span>
                    <span className="font-mono text-white">99.98% (HTTP 200 OK)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                    <span className="text-slate-400">Signature Security</span>
                    <span className="font-mono text-white">HMAC SHA-256 Verifier</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/[0.04]">
                    <span className="text-slate-400">Audio Sync Method</span>
                    <span className="font-mono text-white">Dual-Channel S3 Pre-signed</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">Active Retainer SLA</span>
                    <span className="font-mono text-cyan-400 font-bold">{clientData?.planTier || 'Enterprise Dedicated'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Webhook Event Dispatch Stream */}
            <div className="bg-[#090D17]/90 border border-white/[0.08] rounded-2xl p-5 space-y-3 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white text-xs font-mono uppercase tracking-wider">
                    Recent Carrier & Webhook Dispatches (Audit Trail)
                  </h4>
                  <p className="text-[11px] text-slate-400">Real-time telemetry payload transmission to client CRM</p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                  Buffer: 100% Intact
                </span>
              </div>

              <div className="bg-[#06080F] rounded-xl border border-white/[0.06] p-4 font-mono text-[11px] space-y-2.5 text-slate-300">
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-bold">[200 OK]</span>
                  <span className="text-slate-500">2026-09-29 14:48:12 UTC</span>
                  <span className="text-cyan-400">POST /webhook/telephony/cdr</span>
                  <span className="text-slate-400 ml-auto">Duration: 182s • Sentiment: +0.88</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-bold">[200 OK]</span>
                  <span className="text-slate-500">2026-09-29 14:48:15 UTC</span>
                  <span className="text-emerald-400">POST /webhook/calendar/appointment_booked</span>
                  <span className="text-slate-400 ml-auto">Slot: Confirmed VIP Slot</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-bold">[200 OK]</span>
                  <span className="text-slate-500">2026-09-29 14:48:18 UTC</span>
                  <span className="text-purple-400">POST /webhook/crm/lead_qualification_summary</span>
                  <span className="text-slate-400 ml-auto">Salesforce Lead ID: SF_99182</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: BUSINESS KNOWLEDGE BASE & SERVICES CATALOG */}
        {activeTab === 'knowledge' && (
          <div className="space-y-6">
            {/* Header with Save Action */}
            <div className="bg-[#090D17]/90 border border-white/[0.08] rounded-2xl p-6 shadow-xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <BookOpen size={16} />
                  </span>
                  <h2 className="text-base font-extrabold text-white">
                    Autonomous Business Knowledge Base & Offerings
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  This business intelligence powers both <span className="text-emerald-400 font-semibold">Autonomous Outbound Lead Dialing</span> and the <span className="text-cyan-400 font-semibold">24/7 Inbound Virtual Receptionist</span>. Any update here is instantly active on live calls without redeployment.
                </p>
              </div>

              <div className="flex items-center gap-3 self-start md:self-auto">
                {kbSavedMsg && (
                  <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
                    <CheckCheck size={16} /> Changes Synced to Engine!
                  </span>
                )}
                <button
                  onClick={handleSaveKnowledge}
                  disabled={savingKb}
                  className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 text-xs active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Save size={14} className={savingKb ? 'animate-spin' : ''} />
                  <span>{savingKb ? 'Saving to Trunk...' : 'Save Knowledge Base'}</span>
                </button>
              </div>
            </div>

            {/* Grid 1: Business Overview & Hours */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Business Description */}
              <div className="md:col-span-2 bg-[#090D17]/90 border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Building2 size={14} className="text-indigo-400" />
                    <span>Business Profile & Value Proposition</span>
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    Live Prompt Context
                  </span>
                </div>
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1.5">
                    What does your business do? (AI uses this to pitch and answer inquiries)
                  </label>
                  <textarea
                    rows={4}
                    value={kbData?.businessDescription || ''}
                    onChange={(e) => setKbData(prev => ({ ...prev, businessDescription: e.target.value }))}
                    placeholder="Enter what your business offers, key differentiators, and target clientele..."
                    className="w-full bg-[#06080F] border border-white/[0.08] rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed transition"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">
                      Operating Hours (AI checks before booking)
                    </label>
                    <input
                      type="text"
                      value={kbData?.operatingHours || ''}
                      onChange={(e) => setKbData(prev => ({ ...prev, operatingHours: e.target.value }))}
                      placeholder="e.g. 09:00 - 20:00 GST (Daily)"
                      className="w-full bg-[#06080F] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">
                      Office / Showroom / Clinic Address
                    </label>
                    <input
                      type="text"
                      value={kbData?.location || ''}
                      onChange={(e) => setKbData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g. Dubai Marina, Emaar Tower 2, Level 14"
                      className="w-full bg-[#06080F] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* AI Persona & Telephony Voice */}
              <div className="bg-[#090D17]/90 border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={14} className="text-amber-400" />
                  <span>AI Persona & Telephony Voice</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="bg-[#06080F] p-3 rounded-xl border border-white/[0.04]">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Agent Name</span>
                    <span className="font-bold text-white text-sm">{clientData?.agentName || 'AI Concierge'}</span>
                  </div>

                  <div className="bg-[#06080F] p-3 rounded-xl border border-white/[0.04]">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Language Dialect Engine</span>
                    <span className="font-semibold text-emerald-400">
                      {clientData?.country === 'india' 
                        ? 'Natural Hinglish (Hindi + Urban English)' 
                        : clientData?.country === 'canada' 
                        ? 'Canadian English (GTA / Metro Native)' 
                        : 'Executive International English'}
                    </span>
                  </div>

                  <div className="bg-[#06080F] p-3 rounded-xl border border-white/[0.04]">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Assigned Voice Provider</span>
                    <span className="font-semibold text-cyan-300 font-mono">
                      {clientData?.voiceProvider || 'Cartesia Sonic P99'}
                    </span>
                  </div>

                  <div className="bg-[#06080F] p-3 rounded-xl border border-white/[0.04]">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">STIR/SHAKEN Caller ID</span>
                    <span className="font-semibold text-white font-mono flex items-center gap-1.5">
                      <ShieldCheck size={13} className="text-emerald-400" />
                      {clientData?.assignedNumber || '+971 4 821 9920'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid 2: Services & Pricing Catalog */}
            <div className="bg-[#090D17]/90 border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
                <div>
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Package size={15} className="text-cyan-400" />
                    <span>Services & Pricing Catalog (AI Knowledge Base)</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    When leads or callers ask for prices, packages, or bookings, the AI quotes strictly from this verified inventory.
                  </p>
                </div>
                <span className="text-xs font-mono px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold self-start sm:self-auto">
                  {kbData?.services?.length || 0} Active Offerings
                </span>
              </div>

              {/* Service Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {kbData?.services?.map((svc) => (
                  <div
                    key={svc.id}
                    className="bg-[#06080F] border border-white/[0.06] hover:border-cyan-500/30 rounded-2xl p-4.5 space-y-3 transition group relative"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-white text-xs leading-snug group-hover:text-cyan-300 transition">
                        {svc.name}
                      </h4>
                      <button
                        onClick={() => handleDeleteService(svc.id)}
                        className="text-slate-500 hover:text-rose-400 transition p-1 rounded-lg hover:bg-rose-500/10 cursor-pointer"
                        title="Remove Service"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-base font-extrabold text-cyan-400 font-mono">
                        {svc.price}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded">
                        {svc.duration || 'Session'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.03]">
                      {svc.deliverable}
                    </p>
                  </div>
                ))}
              </div>

              {/* Add New Service Form */}
              <form onSubmit={handleAddService} className="bg-[#06080F]/80 border border-white/[0.06] rounded-2xl p-4 space-y-3">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  + Add New Offering / Package
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Offering Name (e.g. VIP Penthouse Tour)"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    className="bg-[#090D17] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <input
                    type="text"
                    placeholder="Price (e.g. AED 1.5M / ₹2,500 / $350)"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                    className="bg-[#090D17] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Deliverables & details..."
                      value={newServiceDeliverable}
                      onChange={(e) => setNewServiceDeliverable(e.target.value)}
                      className="flex-1 bg-[#090D17] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="submit"
                      disabled={!newServiceName.trim()}
                      className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 transition cursor-pointer disabled:opacity-40"
                    >
                      <Plus size={14} />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Grid 3: Smart FAQ & Objection Handling */}
            <div className="bg-[#090D17]/90 border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
                <div>
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <HelpCircle size={15} className="text-emerald-400" />
                    <span>Smart FAQ & Objection Handling Rules</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    When callers throw objections, negotiating queries, or doubts, the AI responds with these exact vetted answers.
                  </p>
                </div>
                <span className="text-xs font-mono px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold self-start sm:self-auto">
                  {kbData?.faq?.length || 0} Handlers Active
                </span>
              </div>

              {/* FAQ List */}
              <div className="space-y-3">
                {kbData?.faq?.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-[#06080F] border border-white/[0.06] hover:border-emerald-500/30 rounded-2xl p-4.5 space-y-2 transition group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Q
                        </span>
                        <h4 className="font-bold text-white text-xs">
                          {item.q}
                        </h4>
                      </div>
                      <button
                        onClick={() => handleDeleteFaq(idx)}
                        className="text-slate-500 hover:text-rose-400 transition p-1 rounded-lg hover:bg-rose-500/10 cursor-pointer"
                        title="Delete FAQ"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="pl-7 text-xs text-slate-300 leading-relaxed flex items-start gap-2">
                      <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase mt-0.5">AI:</span>
                      <p>{item.a}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New FAQ Form */}
              <form onSubmit={handleAddFaq} className="bg-[#06080F]/80 border border-white/[0.06] rounded-2xl p-4 space-y-3">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  + Add Custom Objection or Question
                </span>
                <div className="space-y-2.5">
                  <input
                    type="text"
                    placeholder="Customer Objection / Question (e.g. Can I reschedule if needed?)"
                    value={newFaqQ}
                    onChange={(e) => setNewFaqQ(e.target.value)}
                    className="w-full bg-[#090D17] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="How should AI answer? (e.g. Absolutely, rescheduling is complimentary with 2 hours prior notice.)"
                      value={newFaqA}
                      onChange={(e) => setNewFaqA(e.target.value)}
                      className="flex-1 bg-[#090D17] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="submit"
                      disabled={!newFaqQ.trim() || !newFaqA.trim()}
                      className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 transition cursor-pointer disabled:opacity-40"
                    >
                      <Plus size={14} />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Section 4: Post-Call Customer Delivery Automations */}
            <div className="bg-[#090D17]/90 border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <MessageSquare size={15} className="text-emerald-400" />
                    <span>Post-Call Customer Automations (WhatsApp & SMS Dispatches)</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Triggered automatically within 5 seconds of call termination (200 BYE)
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
                  ✓ Enterprise Webhooks Active
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="bg-[#06080F] border border-white/[0.06] rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">WhatsApp Confirmation</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Enabled</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Sends branded appointment pass, calendar .ics invite, and Google Maps location pin directly to customer's WhatsApp.
                  </p>
                </div>

                <div className="bg-[#06080F] border border-white/[0.06] rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">SMS Fallback Delivery</span>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">Tier-1 Route</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    If customer does not have WhatsApp active, an instant carrier SMS with appointment slot code is dispatched.
                  </p>
                </div>

                <div className="bg-[#06080F] border border-white/[0.06] rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Internal Team Alert</span>
                    <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">Instant Push</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Immediate Slack / Telegram / Email notification dispatched to client sales team with full recording and audio transcript.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Slide-out Inspection Drawer */}
      <CallDrawer 
        call={selectedCall} 
        onClose={() => setSelectedCall(null)} 
      />

      {/* UPDATE DP / LOGO MODAL */}
      {showDpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#090D17] border border-white/[0.12] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Camera size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Organization Profile Picture / DP</h3>
                  <p className="text-xs text-slate-400">Upload a brand logo or custom image for this workspace.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDpModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Live DP Preview Box */}
            <div className="flex flex-col items-center justify-center p-5 bg-[#06080F] rounded-2xl border border-white/[0.06] space-y-3">
              <div className="relative">
                {previewDp ? (
                  <img 
                    src={previewDp} 
                    alt="Preview DP" 
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500 shadow-xl"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border-2 border-dashed border-indigo-500/40 text-indigo-400 flex flex-col items-center justify-center font-bold text-lg">
                    <Building2 size={32} />
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 bg-indigo-600 text-white rounded-full p-1 border border-black shadow">
                  <Camera size={12} />
                </span>
              </div>
              <div className="text-center">
                <div className="font-bold text-white text-sm">{clientData?.name}</div>
                <div className="text-[11px] text-slate-400 font-mono">Workspace Display Avatar</div>
              </div>
            </div>

            {/* Upload Options */}
            <div className="space-y-3.5 text-xs">
              {/* Option 1: File from PC */}
              <div>
                <label className="text-slate-400 font-mono font-bold uppercase text-[10px] block mb-1.5">
                  Option 1: Upload from Computer
                </label>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                  onChange={handleFileUpload}
                  className="hidden" 
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-indigo-500/40 text-slate-200 font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Upload size={14} className="text-indigo-400" />
                  <span>Choose Image File (PNG, JPG, WEBP)</span>
                </button>
              </div>

              {/* Option 2: Image URL */}
              <div>
                <label className="text-slate-400 font-mono font-bold uppercase text-[10px] block mb-1.5">
                  Option 2: Paste Image URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    placeholder="https://example.com/logo.png"
                    value={dpUrlInput}
                    onChange={(e) => {
                      setDpUrlInput(e.target.value);
                      if (e.target.value.startsWith('http')) {
                        setPreviewDp(e.target.value);
                      }
                    }}
                    className="w-full bg-[#0A0E1A] border border-white/[0.08] rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition font-mono"
                  />
                  <div className="absolute right-3 top-2.5 text-slate-500">
                    <Image size={15} />
                  </div>
                </div>
              </div>

              {/* Option 3: Quick Curated Presets */}
              <div>
                <label className="text-slate-400 font-mono font-bold uppercase text-[10px] block mb-1.5">
                  Or Pick a Curated Enterprise DP:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Tower', url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=160&auto=format&fit=crop&q=80' },
                    { label: 'Clinic', url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=160&auto=format&fit=crop&q=80' },
                    { label: 'Condos', url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=160&auto=format&fit=crop&q=80' },
                    { label: 'Corporate', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=160&auto=format&fit=crop&q=80' },
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPreviewDp(p.url);
                        setDpUrlInput(p.url);
                      }}
                      className={`relative rounded-xl overflow-hidden border transition-all p-0.5 cursor-pointer ${
                        previewDp === p.url ? 'border-indigo-500 ring-2 ring-indigo-500/40' : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <img src={p.url} alt={p.label} className="w-full h-11 object-cover rounded-lg" />
                      <span className="text-[9px] font-mono text-center block text-slate-400 mt-0.5">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setShowDpModal(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={uploadingDp || !previewDp}
                onClick={handleSaveDp}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold transition shadow-lg shadow-indigo-500/25 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {uploadingDp ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Saving DP...</span>
                  </>
                ) : dpSuccessMsg ? (
                  <>
                    <Check size={14} className="text-emerald-300" />
                    <span>DP Updated!</span>
                  </>
                ) : (
                  <>
                    <Camera size={14} />
                    <span>Save & Apply DP</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
