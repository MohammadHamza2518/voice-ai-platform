import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, Bot, Sliders, Shield, Key, Plus, 
  DollarSign, Activity, PhoneCall, Check, ExternalLink, RefreshCw, Save, 
  Radio, Copy, CheckCircle2, Zap, Globe, Sparkles, Clock, ArrowUpRight, Search,
  Trash2, Link, CheckCheck
} from 'lucide-react';

export default function SuperAdmin({ onSelectClientView }) {
  const [overview, setOverview] = useState(null);
  const [clients, setClients] = useState([]);
  const [agents, setAgents] = useState([]);
  const [settings, setSettings] = useState(null);
  const [toughTongueStatus, setToughTongueStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('clients'); // clients | agent_studio | api_settings
  const [selectedAgentClient, setSelectedAgentClient] = useState('');
  const [editingAgent, setEditingAgent] = useState(null);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedDid, setCopiedDid] = useState(null);
  const [copiedLink, setCopiedLink] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // New Client Form State
  const [newClient, setNewClient] = useState({
    name: '',
    country: 'dubai', // 'india' | 'dubai' | 'canada'
    industry: 'Real Estate',
    contactPerson: '',
    email: '',
    phone: '+971 50 ',
    monthlyRetainer: '2,500 AED/mo',
    allocatedMinutes: 1200,
    toughTongueScenarioId: '6abbefa48b398e50c7c059dd',
    customScenarioId: '',
    logo: ''
  });

  // Settings State
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [phoneIdInput, setPhoneIdInput] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchAdminData = async () => {
    try {
      const [resOverview, resClients, resAgents, resSettings, resTT] = await Promise.all([
        fetch('/api/admin/overview'),
        fetch('/api/admin/clients'),
        fetch('/api/admin/agents'),
        fetch('/api/admin/settings'),
        fetch('/api/admin/toughtongue/status').catch(() => null)
      ]);

      if (resOverview?.ok) setOverview(await resOverview.json());
      if (resClients?.ok) {
        const clientList = await resClients.json();
        setClients(clientList);
        if (clientList.length > 0 && !selectedAgentClient) {
          setSelectedAgentClient(clientList[0].id);
        }
      }
      if (resAgents?.ok) setAgents(await resAgents.json());
      if (resSettings?.ok) {
        const s = await resSettings.json();
        setSettings(s);
        setPhoneIdInput(s.vapiPhoneNumberId || '');
      }
      if (resTT?.ok) {
        setToughTongueStatus(await resTT.json());
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Update selected agent when client dropdown changes
  useEffect(() => {
    if (selectedAgentClient && agents.length > 0) {
      const matched = agents.find(a => a.clientId === selectedAgentClient);
      setEditingAgent(matched || null);
    }
  }, [selectedAgentClient, agents]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedDid(text);
    setTimeout(() => setCopiedDid(null), 2000);
  };

  const handleSaveAgent = async () => {
    if (!editingAgent) return;
    try {
      const res = await fetch('/api/admin/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingAgent)
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        fetchAdminData();
      }
    } catch (err) {
      alert('Error saving agent: ' + err.message);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vapiApiKey: apiKeyInput || undefined,
          vapiPhoneNumberId: phoneIdInput || undefined
        })
      });
      if (res.ok) {
        alert('Telephony API settings successfully updated!');
        setApiKeyInput('');
        fetchAdminData();
      }
    } catch (err) {
      alert('Error saving settings: ' + err.message);
    }
  };

  const handleCopyClientPortalLink = (clientId, clientName) => {
    const url = `${window.location.origin}/#/portal/${clientId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(clientId);
    showToast(`Direct Client Portal link copied for ${clientName}! Share this URL with your client.`);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const handleDeleteClient = async (clientId, clientName) => {
    if (!window.confirm(`Are you sure you want to delete "${clientName}"? This will remove all their call logs and configurations.`)) return;
    try {
      const res = await fetch(`/api/admin/clients/${clientId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`Tenant "${clientName}" deleted successfully.`);
        fetchAdminData();
      } else {
        alert('Failed to delete client');
      }
    } catch (e) {
      alert('Error deleting client: ' + e.message);
    }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    if (!newClient.name) return alert('Client name is required');

    const scenarioIdToUse = newClient.toughTongueScenarioId === 'custom' 
      ? newClient.customScenarioId 
      : newClient.toughTongueScenarioId;

    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newClient,
          toughTongueScenarioId: scenarioIdToUse
        })
      });
      if (res.ok) {
        setShowAddClientModal(false);
        showToast(`Tenant "${newClient.name}" provisioned and connected!`);
        setNewClient({
          name: '',
          country: 'dubai',
          industry: 'Real Estate',
          contactPerson: '',
          email: '',
          phone: '+971 50 ',
          monthlyRetainer: '2,500 AED/mo',
          allocatedMinutes: 1200,
          toughTongueScenarioId: '6abbefa48b398e50c7c059dd',
          customScenarioId: '',
          logo: ''
        });
        fetchAdminData();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to create client');
      }
    } catch (err) {
      alert('Error creating client: ' + err.message);
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.assignedNumber.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-[#05070D] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-300">
      {/* Top Carrier Operator Header */}
      <header className="border-b border-white/[0.08] bg-[#080C16] px-6 py-4 shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Telecom Logo Icon */}
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600/30 via-indigo-500/20 to-cyan-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center font-bold shadow-lg shadow-indigo-500/10">
              <Radio size={20} className="text-indigo-400 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-extrabold text-white text-base tracking-tight flex items-center gap-2">
                  <span className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                    AETHERIS TELECOM OS
                  </span>
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-bold uppercase tracking-wider">
                  Operator Control Plane
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hidden sm:flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Core: 99.99% Uptime (412ms P99)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 font-normal">
                <span>Multi-Trunk (e& UAE • Tata PRI • Telus Canada)</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400 hidden md:inline">Speech Synthesis Latency: &lt;500ms SLA</span>
                <span className="text-slate-600 hidden md:inline">•</span>
                <span className="text-indigo-400 font-mono text-[11px] hidden lg:inline">Active Retainers: 3/3</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live UTC presence clocks */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1 text-amber-300">🇦🇪 DXB</span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1 text-orange-300">🇮🇳 DEL</span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1 text-rose-300">🇨🇦 TOR</span>
            </div>

            <button
              onClick={() => setShowAddClientModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs transition-all duration-200 flex items-center gap-2 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-95 cursor-pointer"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Provision New Tenant</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin View */}
      <main className="max-w-7xl mx-auto w-full p-6 space-y-6 flex-1">
        {/* MNC Telephony KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Active Retainers */}
          <div className="relative overflow-hidden bg-[#0A0E1A]/80 border border-white/[0.08] hover:border-indigo-500/40 rounded-2xl p-5 shadow-xl transition-all duration-300 hover:-translate-y-0.5 group">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                Active Tenant Retainers
              </span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Building2 size={16} />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-3">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {overview?.totalClients || clients.length}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                100% SLA Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-mono">
              Recurring ARR: <span className="text-slate-300 font-semibold">$8,450 USD equiv</span>
            </p>
          </div>

          {/* Card 2: Global Minutes Pool */}
          <div className="relative overflow-hidden bg-[#0A0E1A]/80 border border-white/[0.08] hover:border-cyan-500/40 rounded-2xl p-5 shadow-xl transition-all duration-300 hover:-translate-y-0.5 group">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                Global Minutes Pool
              </span>
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Clock size={16} />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-3">
              <span className="text-3xl font-extrabold text-cyan-400 tracking-tight font-mono">
                {overview?.totalUsedMinutes || 0}
                <span className="text-base text-slate-500 font-normal"> / {overview?.totalAllocatedMinutes || 0}</span>
              </span>
              <span className="text-xs font-mono text-slate-400">
                {Math.round(((overview?.totalUsedMinutes || 0) / (overview?.totalAllocatedMinutes || 1)) * 100)}% Used
              </span>
            </div>
            <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden mt-2.5">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round(((overview?.totalUsedMinutes || 0) / (overview?.totalAllocatedMinutes || 1)) * 100))}%` }}
              />
            </div>
          </div>

          {/* Card 3: Commercial Milestones */}
          <div className="relative overflow-hidden bg-[#0A0E1A]/80 border border-white/[0.08] hover:border-emerald-500/40 rounded-2xl p-5 shadow-xl transition-all duration-300 hover:-translate-y-0.5 group">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                Appointments Locked
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-3">
              <span className="text-3xl font-extrabold text-emerald-400 tracking-tight">
                {overview?.totalBookedAppointments || 0}
              </span>
              <span className="text-[11px] font-mono bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/20 font-semibold">
                Verified In-Person
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-mono">
              Conversion Ratio: <span className="text-emerald-400 font-semibold">78.5% of qualified</span>
            </p>
          </div>

          {/* Card 4: Carrier Interconnect */}
          <div className="relative overflow-hidden bg-[#0A0E1A]/80 border border-white/[0.08] hover:border-purple-500/40 rounded-2xl p-5 shadow-xl transition-all duration-300 hover:-translate-y-0.5 group">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                Carrier Signaling Mesh
              </span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Shield size={16} />
              </div>
            </div>
            <div className="flex items-baseline justify-between mt-3">
              <span className="text-base font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Multi-Trunk Active
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold">
                STIR/SHAKEN A
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-mono">
              3 Direct Trunks: <span className="text-slate-300 font-semibold">e& • Tata • Telus</span>
            </p>
          </div>
        </div>

        {/* Tab Controls & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div className="bg-[#0A0E1A] p-1.5 rounded-2xl border border-white/[0.08] inline-flex items-center gap-1.5 shadow-inner">
            {[
              { id: 'clients', label: 'Tenant Organizations & Carrier Trunks', icon: Building2, count: clients.length },
              { id: 'agent_studio', label: 'Autonomous Voice Engine Studio', icon: Bot, count: agents.length },
              { id: 'api_settings', label: 'Carrier Gateways & SIP Credentials', icon: Key },
            ].map(tab => {
              const Icon = tab.icon;
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
                  <Icon size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
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

          {activeTab === 'clients' && (
            <div className="relative w-full sm:w-72">
              <Search size={14} className="absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="Filter by organization, DID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0A0E1A] border border-white/[0.08] rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          )}
        </div>

        {/* TAB 1: CLIENT MANAGEMENT (Directory Table) */}
        {activeTab === 'clients' && (
          <div className="bg-[#090D17]/90 border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.02] text-slate-400 font-semibold border-b border-white/[0.06] uppercase text-[10px] font-mono tracking-wider">
                  <tr>
                    <th className="py-4 px-5">Tenant Organization</th>
                    <th className="py-4 px-5">Direct E.164 Line & Route</th>
                    <th className="py-4 px-5">Monthly Retainer</th>
                    <th className="py-4 px-5">Billable Minutes Pool</th>
                    <th className="py-4 px-5">Voice Engine Persona</th>
                    <th className="py-4 px-5 text-right">Workspace Access</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredClients.map(client => {
                    const countryMeta = client.country === 'india' 
                      ? { flag: '🇮🇳', label: 'INDIA', badge: 'bg-orange-500/10 text-orange-300 border-orange-500/20' }
                      : client.country === 'canada'
                      ? { flag: '🇨🇦', label: 'CANADA', badge: 'bg-rose-500/10 text-rose-300 border-rose-500/20' }
                      : { flag: '🇦🇪', label: 'DUBAI', badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20' };

                    const usagePct = Math.min(100, Math.round(((client.usedMinutes || 0) / (client.allocatedMinutes || 1000)) * 100));

                    return (
                      <tr 
                        key={client.id} 
                        className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                        onClick={() => onSelectClientView(client.id)}
                      >
                        {/* Column 1: Tenant Organization */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3.5">
                            {/* Logo or Monogram */}
                            {client.logo ? (
                              <img 
                                src={client.logo} 
                                alt={client.name} 
                                className="w-10 h-10 rounded-xl object-cover border border-white/10 shadow-sm shrink-0" 
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
                                {client.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}

                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 ${countryMeta.badge}`}>
                                  <span>{countryMeta.flag}</span>
                                  <span>{countryMeta.label}</span>
                                </span>
                                <h3 className="font-bold text-white text-sm tracking-tight group-hover:text-indigo-300 transition">
                                  {client.name}
                                </h3>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-2 font-normal">
                                <span className="text-slate-300">{client.industry}</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-400">{client.contactPerson}</span>
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Column 2: Direct E.164 Line & Carrier Route */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-white font-semibold text-xs bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/[0.08]">
                              {client.assignedNumber}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(client.assignedNumber);
                              }}
                              className="text-slate-500 hover:text-indigo-400 transition p-1"
                              title="Copy E.164 DID"
                            >
                              {copiedDid === client.assignedNumber ? (
                                <Check size={12} className="text-emerald-400" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 mt-1 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            <span>{client.carrier || 'Direct SIP Interconnect'}</span>
                          </div>
                        </td>

                        {/* Column 3: Monthly Retainer */}
                        <td className="py-4 px-5">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 font-bold font-mono text-xs">
                            {client.monthlyRetainer}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-1 font-mono">
                            {client.planTier || 'Enterprise Dedicated SLA'}
                          </div>
                        </td>

                        {/* Column 4: Billable Minutes Pool */}
                        <td className="py-4 px-5">
                          <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                            <span className="text-white font-semibold">{client.usedMinutes || 0} / {client.allocatedMinutes || 1000}m</span>
                            <span className="text-slate-400 text-[10px]">{usagePct}%</span>
                          </div>
                          <div className="w-32 bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                usagePct > 80 ? 'bg-amber-400' : 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                              }`}
                              style={{ width: `${usagePct}%` }}
                            />
                          </div>
                        </td>

                        {/* Column 5: Autonomous Voice Engine & ToughTongue */}
                        <td className="py-4 px-5">
                          <div className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                            <Zap size={13} className="text-indigo-400" />
                            <span>{client.agent?.name || 'Autonomous Lead Qualifier'}</span>
                          </div>
                          <div className="text-[10px] font-mono text-indigo-300 mt-1 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            <span>ToughTongue: {client.toughTongueScenarioId ? client.toughTongueScenarioId.slice(0, 8) + '...' : 'Auto'}</span>
                          </div>
                        </td>

                        {/* Column 6: Client Portal Access & Actions */}
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectClientView(client.id);
                              }}
                              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-500/20 active:scale-95 cursor-pointer"
                              title={`Access portal for ${client.name}`}
                            >
                              <span>🚀 Access Portal</span>
                              <ArrowUpRight size={13} />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyClientPortalLink(client.id, client.name);
                              }}
                              className={`p-2 rounded-xl border text-xs transition cursor-pointer ${
                                copiedLink === client.id
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : 'bg-white/[0.04] hover:bg-white/10 text-slate-300 hover:text-white border-white/[0.08]'
                              }`}
                              title="Copy Direct Shareable Client Portal Link"
                            >
                              {copiedLink === client.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveTab('agent_studio');
                                setSelectedAgentClient(client.id);
                              }}
                              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/10 text-slate-400 hover:text-indigo-300 border border-white/[0.08] text-xs transition cursor-pointer"
                              title="Configure AI Agent for this client"
                            >
                              <Bot size={14} />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClient(client.id, client.name);
                              }}
                              className="p-2 rounded-xl bg-white/[0.04] hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 border border-white/[0.08] text-xs transition cursor-pointer"
                              title="Delete Client"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredClients.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-500 text-xs">
                        No organizations found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: AI AGENT STUDIO (The Agency Moat) */}
        {activeTab === 'agent_studio' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: Client Selector */}
            <div className="bg-[#090D17]/90 border border-white/[0.08] rounded-2xl p-5 space-y-3 shadow-xl backdrop-blur-xl">
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Select Client Workspace
              </span>
              <div className="space-y-2">
                {clients.map(c => {
                  const isSelected = selectedAgentClient === c.id;
                  const countryFlag = c.country === 'india' ? '🇮🇳' : c.country === 'canada' ? '🇨🇦' : '🇦🇪';
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedAgentClient(c.id)}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600/15 border-indigo-500/50 text-white shadow-md'
                          : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                      }`}
                    >
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          <span>{countryFlag}</span>
                          <span className={isSelected ? 'text-white' : 'text-slate-300'}>{c.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{c.industry}</div>
                      </div>
                      {isSelected && <Check size={15} className="text-indigo-400" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Agent Configurator */}
            {editingAgent ? (
              <div className="md:col-span-2 bg-[#090D17]/90 border border-white/[0.08] rounded-2xl p-6 space-y-5 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                  <div>
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                      <Bot size={18} className="text-indigo-400" />
                      <span>{editingAgent.name}</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Configuring Autonomous Voice Engine for: <strong className="text-slate-200">{clients.find(c => c.id === selectedAgentClient)?.name}</strong>
                    </p>
                  </div>
                  <button
                    onClick={handleSaveAgent}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save size={14} />
                    <span>{saveSuccess ? 'Saved & Deployed!' : 'Save & Deploy Agent'}</span>
                  </button>
                </div>

                {/* Language & Market Engine Presets */}
                <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={13} className="text-amber-400" />
                      <span>1-Click Regional Dialect & Persona Presets</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Auto-Optimized LLM Prompt</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* 1. Dubai & UAE */}
                    <button
                      type="button"
                      onClick={() => {
                        const clientName = clients.find(c => c.id === selectedAgentClient)?.name || 'Company';
                        setEditingAgent({
                          ...editingAgent,
                          languageMode: 'english_dubai',
                          voiceProvider: 'Cartesia Sonic (British/Neutral English - 90ms)',
                          transcriberLanguage: 'en',
                          firstMessage: `Good afternoon! This is Sarah from ${clientName}. I noticed your recent inquiry and wanted to confirm if this is a good moment for a quick 1-minute update?`,
                          systemPrompt: `You are Sarah, an articulate and prestigious senior client advisor at ${clientName}.
Speak in natural, courteous International / British English.
Target Audience: High-net-worth investors, professionals, and expats (Dubai / Global).

Key Objectives:
1. Always maintain a calm, professional, and confident executive tone.
2. Ask one question at a time.
3. Qualify 3 criteria:
   - Purpose: End-use living or high-yield investment?
   - Budget range: Under 2M AED, 2M - 4M AED, or 4M+ Ultra-luxury?
   - Timeline: Immediate / ready to move, or off-plan 2026/2027?
4. When qualified, immediately lock a calendar slot: Saturday 11:00 AM or Sunday 4:00 PM for a private VIP walkthrough or Zoom consultation.
5. If the prospect is in a meeting or asks to WhatsApp details, confirm their number and politely conclude.`
                        });
                      }}
                      className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all flex flex-col justify-between cursor-pointer ${
                        editingAgent.languageMode === 'english_dubai' || (!editingAgent.languageMode && !editingAgent.clientId?.includes('zenith') && !editingAgent.clientId?.includes('maple'))
                          ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                          : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-white">
                          <span>🇦🇪</span> Dubai Executive
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 font-normal leading-tight">
                          Cartesia Sonic • British/Neutral • 90ms TTFA
                        </div>
                      </div>
                      <span className="text-[9px] font-mono px-2 py-0.5 mt-2 rounded bg-amber-500/20 text-amber-300 self-start">
                        {editingAgent.languageMode === 'english_dubai' ? '✓ Selected' : 'Apply Preset'}
                      </span>
                    </button>

                    {/* 2. India */}
                    <button
                      type="button"
                      onClick={() => {
                        const clientName = clients.find(c => c.id === selectedAgentClient)?.name || 'Company';
                        setEditingAgent({
                          ...editingAgent,
                          languageMode: 'hinglish_india',
                          voiceProvider: 'Deepgram Aura Priya (Indian English / Hinglish)',
                          transcriberLanguage: 'hi-Latn',
                          firstMessage: `Namaste! Main ${clientName} ki taraf se Priya baat kar rahi hoon. Aapne hamare project ke liye inquiry submit ki thi—kya main aapka 1 minute le sakti hoon details batane ke liye?`,
                          systemPrompt: `You are Priya, a polite, warm, and highly professional sales coordinator at ${clientName}.
Speak in natural, conversational HINGLISH (a natural blend of Hindi and Indian English, exactly how educated urban Indians speak on the phone).

Key Objectives:
1. Greet with natural Indian warmth ('Namaste sir/ma'am').
2. Qualify requirement:
   - Specific service or unit size needed?
   - Budget estimate (₹ lakhs/crores)?
   - Immediate requirement or exploratory?
3. Lock confirmed in-person site visit or doctor consultation for Saturday or Sunday at 11:00 AM.
4. Keep answers crisp and avoid long robotic monologues.`
                        });
                      }}
                      className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all flex flex-col justify-between cursor-pointer ${
                        editingAgent.languageMode === 'hinglish_india'
                          ? 'bg-orange-500/15 border-orange-500/50 text-orange-200'
                          : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-white">
                          <span>🇮🇳</span> Natural Hinglish
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 font-normal leading-tight">
                          Deepgram Aura Priya • Natural Urban Hindi/English
                        </div>
                      </div>
                      <span className="text-[9px] font-mono px-2 py-0.5 mt-2 rounded bg-orange-500/20 text-orange-300 self-start">
                        {editingAgent.languageMode === 'hinglish_india' ? '✓ Selected' : 'Apply Preset'}
                      </span>
                    </button>

                    {/* 3. Canada */}
                    <button
                      type="button"
                      onClick={() => {
                        const clientName = clients.find(c => c.id === selectedAgentClient)?.name || 'Company';
                        setEditingAgent({
                          ...editingAgent,
                          languageMode: 'english_canada',
                          voiceProvider: 'ElevenLabs Turbo v2.5 (Canadian / North American Friendly)',
                          transcriberLanguage: 'en-US',
                          firstMessage: `Hi there! This is Chloe calling from ${clientName}. Thanks for checking out our new property release! Do you have a quick minute to chat about your search?`,
                          systemPrompt: `You are Chloe, an approachable, highly knowledgeable, and polite senior client advisor at ${clientName}.
Speak in natural, warm, and friendly Canadian / North American English.
Target Audience: Canadian homebuyers, first-time buyers, and real estate investors.

Key Objectives:
1. Maintain friendly, professional Canadian conversational pacing.
2. Qualify:
   - Price bracket in CAD ($600k - $1M+)?
   - Mortgage pre-approval with Canadian bank (TD, RBC, Scotiabank)?
   - Timeline: 30-90 days closing or pre-construction 2026/2027?
3. Secure private showing or Zoom consultation with lead agent for Saturday at 2:00 PM EST.`
                        });
                      }}
                      className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all flex flex-col justify-between cursor-pointer ${
                        editingAgent.languageMode === 'english_canada'
                          ? 'bg-rose-500/15 border-rose-500/50 text-rose-200'
                          : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-white">
                          <span>🇨🇦</span> Canadian English
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 font-normal leading-tight">
                          ElevenLabs Turbo • Friendly Canadian / GTA Accent
                        </div>
                      </div>
                      <span className="text-[9px] font-mono px-2 py-0.5 mt-2 rounded bg-rose-500/20 text-rose-300 self-start">
                        {editingAgent.languageMode === 'english_canada' ? '✓ Selected' : 'Apply Preset'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* First Message & System Prompt */}
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      First Message (Instant Greeting on Connected SIP 200 OK)
                    </label>
                    <input
                      type="text"
                      value={editingAgent.firstMessage}
                      onChange={(e) => setEditingAgent({ ...editingAgent, firstMessage: e.target.value })}
                      className="w-full bg-[#0A0E1A] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition font-sans"
                    />
                  </div>

                  {/* ToughTongue Live WebRTC Scenario ID */}
                  <div>
                    <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Radio size={13} className="text-cyan-400" />
                        <span>ToughTongue Live Voice Scenario ID (White-Label WebRTC)</span>
                      </span>
                      <span className="text-[10px] text-cyan-400 font-mono">Real-Time Zero Latency</span>
                    </label>
                    <input
                      type="text"
                      value={clients.find(c => c.id === selectedAgentClient)?.toughTongueScenarioId || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setClients(prev => prev.map(c => c.id === selectedAgentClient ? { ...c, toughTongueScenarioId: val } : c));
                        fetch(`/api/admin/clients/${selectedAgentClient}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ toughTongueScenarioId: val })
                        });
                      }}
                      placeholder="e.g. 6abbefa48b398e50c7c059dd"
                      className="w-full bg-[#0A0E1A] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 transition"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Sarah (Dubai Closer): <code className="text-slate-400">6abbefa48b398e50c7c059dd</code> • Priya (Clinic Hinglish): <code className="text-slate-400">6abbefb8077df1a1f09c02e1</code>
                    </p>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Autonomous Behavior Prompt (LLM Telephony Core)
                    </label>
                    <textarea
                      rows={9}
                      value={editingAgent.systemPrompt}
                      onChange={(e) => setEditingAgent({ ...editingAgent, systemPrompt: e.target.value })}
                      className="w-full bg-[#0A0E1A] border border-white/[0.08] rounded-xl p-3.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 transition leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="md:col-span-2 bg-[#090D17]/90 border border-white/[0.08] rounded-2xl p-12 text-center text-slate-500">
                Select a tenant from the left sidebar to configure autonomous voice settings.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TELEPHONY & CARRIER API SETTINGS */}
        {activeTab === 'api_settings' && (
          <div className="bg-[#090D17]/90 border border-white/[0.08] rounded-2xl p-6 max-w-2xl space-y-6 shadow-2xl backdrop-blur-xl">
            <div className="border-b border-white/[0.08] pb-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Key size={18} className="text-indigo-400" />
                <span>Enterprise Carrier Telephony Vault</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Keys and SIP trunk credentials are securely held on the backend environment and are NEVER exposed to client tenant sessions.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Vapi Private Enterprise API Key
                </label>
                <input
                  type="password"
                  placeholder="vapi_live_..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full bg-[#0A0E1A] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 transition"
                />
                <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                  Current Key Status: {settings?.maskedKey || 'Not configured'}
                </span>
              </div>

              <div>
                <label className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Carrier Direct SIP Number ID / Trunk UUID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                  value={phoneIdInput}
                  onChange={(e) => setPhoneIdInput(e.target.value)}
                  className="w-full bg-[#0A0E1A] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <button
                onClick={handleSaveSettings}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs transition shadow-lg shadow-indigo-500/20 cursor-pointer"
              >
                Update Telephony Settings
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Provision New Client Modal */}
      {showAddClientModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#090D17] border border-white/[0.12] rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
              <div>
                <h3 className="font-bold text-white text-base">Provision New Tenant Organization</h3>
                <p className="text-xs text-slate-400">Deploy dedicated E.164 line, carrier interconnect, and voice agent.</p>
              </div>
              <button 
                onClick={() => setShowAddClientModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4 text-xs">
              {/* Target Country Selector */}
              <div>
                <label className="text-slate-400 font-mono font-bold uppercase text-[10px] block mb-2">
                  Target Geography & Carrier Interconnect
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'dubai', flag: '🇦🇪', label: 'Dubai (UAE)', sub: 'e& Direct SIP', phone: '+971 50 ', retainer: '2,500 AED/mo' },
                    { id: 'india', flag: '🇮🇳', label: 'India', sub: 'Tata PRI', phone: '+91 98', retainer: '₹25,000/mo' },
                    { id: 'canada', flag: '🇨🇦', label: 'Canada', sub: 'Telus Interconnect', phone: '+1 416 ', retainer: '$2,200 CAD/mo' },
                  ].map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setNewClient({
                        ...newClient,
                        country: c.id,
                        phone: c.phone,
                        monthlyRetainer: c.retainer
                      })}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        newClient.country === c.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                          : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="text-xl">{c.flag}</span>
                      <span className="font-bold text-xs">{c.label}</span>
                      <span className="text-[10px] font-mono text-slate-500">{c.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-mono font-bold uppercase text-[10px] block mb-1">
                  Tenant Organization Name
                </label>
                <input
                  type="text"
                  required
                  placeholder={newClient.country === 'canada' ? 'e.g. Maple Leaf Homes Toronto' : newClient.country === 'india' ? 'e.g. Apex Realty Mumbai' : 'e.g. Prestige Properties Dubai'}
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  className="w-full bg-[#0A0E1A] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-mono font-bold uppercase text-[10px] block mb-1">Industry</label>
                  <select
                    value={newClient.industry}
                    onChange={(e) => setNewClient({ ...newClient, industry: e.target.value })}
                    className="w-full bg-[#0A0E1A] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition"
                  >
                    <option value="Real Estate">Real Estate</option>
                    <option value="Healthcare / Clinics">Healthcare / Clinics</option>
                    <option value="Automobile Dealership">Automobile Dealership</option>
                    <option value="Immigration & Visa">Immigration & Visa</option>
                    <option value="Home Services">Home Services</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-mono font-bold uppercase text-[10px] block mb-1">Owner Contact Phone</label>
                  <input
                    type="text"
                    value={newClient.phone}
                    onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                    className="w-full bg-[#0A0E1A] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-mono font-bold uppercase text-[10px] block mb-1">Monthly Retainer</label>
                  <input
                    type="text"
                    value={newClient.monthlyRetainer}
                    onChange={(e) => setNewClient({ ...newClient, monthlyRetainer: e.target.value })}
                    className="w-full bg-[#0A0E1A] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-mono font-bold uppercase text-[10px] block mb-1">Billable Minutes Quota</label>
                  <input
                    type="number"
                    value={newClient.allocatedMinutes}
                    onChange={(e) => setNewClient({ ...newClient, allocatedMinutes: e.target.value })}
                    className="w-full bg-[#0A0E1A] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* ToughTongue Voice Agent Preset */}
              <div>
                <label className="text-slate-400 font-mono font-bold uppercase text-[10px] block mb-1">
                  Autonomous Voice Agent (ToughTongue White-Label)
                </label>
                <div className="space-y-2">
                  {[
                    { id: '6abbefa48b398e50c7c059dd', name: 'Sarah - Dubai Luxury Closer', sub: 'Cartesia British/Neutral • High-intent qualifying & appointment booking' },
                    { id: '6abbefb8077df1a1f09c02e1', name: 'Priya - Clinic & Sales Specialist', sub: 'Deepgram Hinglish • Warm urban Indian phone consultation' },
                    { id: 'custom', name: 'Custom ToughTongue Scenario ID', sub: 'Enter custom scenario ID from your ToughTongue dashboard' }
                  ].map(sc => (
                    <label 
                      key={sc.id} 
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                        newClient.toughTongueScenarioId === sc.id
                          ? 'bg-indigo-600/15 border-indigo-500/50 text-white'
                          : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="scenarioChoice"
                        checked={newClient.toughTongueScenarioId === sc.id}
                        onChange={() => setNewClient({ ...newClient, toughTongueScenarioId: sc.id })}
                        className="mt-0.5 text-indigo-500 focus:ring-0"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-xs text-slate-200">{sc.name}</div>
                        <div className="text-[10px] text-slate-500">{sc.sub}</div>
                      </div>
                    </label>
                  ))}
                </div>

                {newClient.toughTongueScenarioId === 'custom' && (
                  <input
                    type="text"
                    required
                    placeholder="Paste ToughTongue Scenario ID (e.g. 6abbefa48b398e...)"
                    value={newClient.customScenarioId}
                    onChange={(e) => setNewClient({ ...newClient, customScenarioId: e.target.value })}
                    className="w-full mt-2 bg-[#0A0E1A] border border-white/[0.08] rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                )}
              </div>

              {/* DP / Logo URL */}
              <div>
                <label className="text-slate-400 font-mono font-bold uppercase text-[10px] block mb-1">
                  Organization Logo / DP (Optional Image URL)
                </label>
                <input
                  type="url"
                  placeholder="https://.../logo.png (leave empty for auto business monogram)"
                  value={newClient.logo}
                  onChange={(e) => setNewClient({ ...newClient, logo: e.target.value })}
                  className="w-full bg-[#0A0E1A] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowAddClientModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold transition shadow-lg shadow-indigo-500/25 cursor-pointer"
                >
                  Provision & Connect Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0E1528] border border-indigo-500/50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
