import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Download, Upload, PhoneCall, Play, Pause, 
  FileSpreadsheet, Sparkles, Building2, Check, Copy, 
  Trash2, Plus, Save, Volume2, Calendar, Clock,
  ChevronDown, ChevronUp, Radio, User, MapPin, 
  Loader2, CheckCircle2, AlertCircle, X, ExternalLink,
  MessageSquare, Send, Mail, FileText, PhoneIncoming, PhoneOutgoing, Headphones
} from 'lucide-react';
import AudioPlayer from './AudioPlayer';
import AiPipelineOverview from './AiPipelineOverview';

export default function ClientPortal({ clientId = 'client_apex_01', onBackToAdmin, fromAdmin = false }) {
  const [clientData, setClientData] = useState(null);
  const [calls, setCalls] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview | find_leads | auto_dialer | recordings | business_info
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
    brochureUrl: 'https://apexproperties.ae/brochure-2026.pdf',
    calendarUrl: 'https://cal.com/apex-luxury/vip-consultation',
    whatsappTemplate: 'Hi {{name}}! 👋 Thank you for speaking with our AI advisor at Apex Luxury Properties. Here is your VIP Showroom pass and 3BHK Brochure: {{link}}',
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

  // WhatsApp 1-Click Dispatch Modal State
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [whatsAppTarget, setWhatsAppTarget] = useState(null); // { name, phone, email, callId }
  const [whatsAppCustomText, setWhatsAppCustomText] = useState('');
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [whatsAppSuccessToast, setWhatsAppSuccessToast] = useState(false);

  // 24/7 Inbound Call Receptionist State
  const [simulatingInbound, setSimulatingInbound] = useState(false);
  const [inboundSuccessToast, setInboundSuccessToast] = useState(false);
  const [callDirectionFilter, setCallDirectionFilter] = useState('all'); // all | inbound | outbound

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
            brochureUrl: client.knowledgeBase.brochureUrl || 'https://apexproperties.ae/brochure-2026.pdf',
            calendarUrl: client.knowledgeBase.calendarUrl || 'https://cal.com/apex-luxury/vip-consultation',
            whatsappTemplate: client.knowledgeBase.whatsappTemplate || 'Hi {{name}}! 👋 Thank you for speaking with our AI advisor at Apex Luxury Properties. Here is your VIP Showroom pass and 3BHK Brochure: {{link}}',
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

  // WhatsApp Automation Handlers
  const handleOpenWhatsAppModal = (target) => {
    setWhatsAppTarget(target);
    const brochure = kbData.brochureUrl || 'https://apexproperties.ae/brochure-2026.pdf';
    setWhatsAppCustomText(
      `Hi ${target.name?.split(' ')[0] || 'there'}! 👋 Thank you for connecting with ${clientData?.name || 'our team'}. As discussed with our AI assistant, here is your official brochure & presentation: ${brochure}`
    );
    setWhatsAppModalOpen(true);
  };

  const handleSendWhatsApp = async (e) => {
    if (e) e.preventDefault();
    if (!whatsAppTarget?.phone) return;
    try {
      setSendingWhatsApp(true);
      const res = await fetch(`/api/portal/client/${clientId}/automations/dispatch-whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: whatsAppTarget.callId,
          leadPhone: whatsAppTarget.phone,
          leadName: whatsAppTarget.name,
          messageText: whatsAppCustomText,
          templateType: 'VIP Brochure & Location Pin'
        })
      });

      if (res.ok) {
        setWhatsAppModalOpen(false);
        setWhatsAppSuccessToast(true);
        setTimeout(() => setWhatsAppSuccessToast(false), 3500);
        // Refresh calls & leads
        fetchAllData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to dispatch WhatsApp');
      }
    } catch (err) {
      console.error('Error dispatching WhatsApp:', err);
      alert('Error sending WhatsApp message');
    } finally {
      setSendingWhatsApp(false);
    }
  };

  // 24/7 Inbound Call Simulation Handler
  const handleSimulateInboundCall = async () => {
    try {
      setSimulatingInbound(true);
      const isIndia = clientData?.country === 'india';
      const isCanada = clientData?.country === 'canada';
      const customerPhone = isIndia ? '+91 98200 44819' : isCanada ? '+1 416 892 4100' : '+971 50 839 2102';
      const customerName = isIndia ? 'Dr. Ananya Sharma' : isCanada ? 'Liam O\'Connor' : 'Rashid Al-Maktoum';

      const res = await fetch('/api/portal/dial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          direction: 'inbound',
          customerPhone,
          customerName
        })
      });

      if (res.ok) {
        const data = await res.json();
        setInboundSuccessToast(true);
        setTimeout(() => setInboundSuccessToast(false), 4500);
        
        // Refresh calls list
        const resCalls = await fetch(`/api/portal/calls/${clientId}`);
        if (resCalls.ok) {
          const freshCalls = await resCalls.json();
          setCalls(freshCalls);
          if (data.call?.id) {
            setExpandedCallId(data.call.id);
          }
          setActiveTab('recordings');
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to simulate inbound call');
      }
    } catch (err) {
      console.error('Error simulating inbound call:', err);
      alert('Error triggering inbound test call');
    } finally {
      setSimulatingInbound(false);
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      {/* Admin Floating Banner (Shown only when opened from Agency Admin) */}
      {fromAdmin && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-indigo-500/30 px-4 md:px-6 py-2.5 flex items-center justify-between text-xs text-indigo-100 shadow-md">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-indigo-500/25 text-indigo-300 font-mono font-bold uppercase text-[10px] border border-indigo-500/40">
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
              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white border border-white/10 text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition"
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

      {/* Clean Light Client Header */}
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 md:px-6 py-4 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {clientData?.logo ? (
              <img 
                src={clientData.logo} 
                alt="Logo" 
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0 block"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold text-base shrink-0">
                <Building2 size={24} />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-slate-900 text-base md:text-lg tracking-tight">
                  {clientData?.name || 'Client Portal'}
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase">
                  Active
                </span>
              </div>
              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-1">
                <span>AI Business Line:</span>
                <span className="font-mono text-slate-800 font-bold bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                  {clientData?.assignedNumber || '+971 4 821 9920'}
                </span>
                <button
                  onClick={() => handleCopy(clientData?.assignedNumber || '')}
                  className="text-slate-400 hover:text-indigo-600 transition p-1"
                  title="Copy Phone Number"
                >
                  {copiedDid ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                </button>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
                  24/7 Inbound Receptionist Active
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats: Calling Minutes & Inbound/Mic Test */}
          <div className="flex flex-wrap items-center gap-2.5 bg-slate-50 border border-slate-200/90 px-3.5 py-2 rounded-2xl shadow-xs">
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-500 font-semibold">Calling Balance</div>
              <div className="text-xs font-bold font-mono text-emerald-600 flex items-center gap-1 mt-0.5">
                <span>{minutesRemaining > 0 ? minutesRemaining : 0}m left</span>
                <span className="text-slate-400 text-[10px]">/ {clientData?.allocatedMinutes || 1000}m</span>
              </div>
            </div>
            <div className="h-6 w-px bg-slate-200 mx-0.5 hidden sm:block" />

            {/* Simulate Customer Inbound Call */}
            <button
              onClick={handleSimulateInboundCall}
              disabled={simulatingInbound}
              className="px-3 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
              title="Simulate a customer calling your business line to test the 24/7 Inbound AI Receptionist"
            >
              {simulatingInbound ? <Loader2 size={13} className="animate-spin text-cyan-600" /> : <PhoneIncoming size={13} className="text-cyan-600" />}
              <span>{simulatingInbound ? 'Answering Call...' : 'Test Inbound Call'}</span>
            </button>

            {/* Test AI Voice via Mic */}
            <button
              onClick={handleStartLiveVoiceCall}
              disabled={startingVoice}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/25 cursor-pointer active:scale-95 disabled:opacity-50"
              title="Test speaking with your AI Voice Agent via your microphone"
            >
              {startingVoice ? <Loader2 size={13} className="animate-spin" /> : <Radio size={13} className="animate-pulse text-cyan-100" />}
              <span>Test Mic Voice</span>
            </button>
          </div>
        </div>
      </header>

      {/* 5 Navigation Tabs (Light Theme) */}
      <div className="border-b border-slate-200 bg-white px-4 md:px-6">
        <div className="max-w-6xl mx-auto flex items-center gap-2 overflow-x-auto py-2">
          {[
            { id: 'overview', label: 'Pipeline Dashboard', icon: Sparkles, badge: 'Viral Reel' },
            { id: 'find_leads', label: '1. Search Apollo Leads', icon: Search, count: leads.length },
            { id: 'auto_dialer', label: '2. Auto-Dialer', icon: PhoneCall, badge: `${leads.length} in Queue` },
            { id: 'recordings', label: '3. Call Recordings & Scripts', icon: Volume2, count: calls.length },
            { id: 'business_info', label: '4. Business Info & FAQs', icon: Building2 }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] font-mono px-2 py-0.2 rounded-full ${
                    isActive ? 'bg-indigo-700 text-white font-bold' : 'bg-slate-100 text-slate-600 font-semibold'
                  }`}>
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span className={`text-[10px] font-mono px-2 py-0.2 rounded-full border ${
                    isActive 
                      ? 'bg-amber-300 text-amber-900 border-amber-400 font-bold' 
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold'
                  }`}>
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
            TAB 0: VIRAL REEL PIPELINE OVERVIEW (Apollo -> AI Call -> Recordings)
            ========================================================= */}
        {activeTab === 'overview' && (
          <AiPipelineOverview 
            onSelectTab={setActiveTab}
            leadsCount={leads.length || 500}
            callsCount={calls.length || 320}
            clientName={clientData?.name}
            assignedNumber={clientData?.assignedNumber || '+91 80-48799695'}
          />
        )}
        
        {/* =========================================================
            TAB 1: SEARCH & FIND LEADS (Download CSV - Light Theme)
            ========================================================= */}
        {activeTab === 'find_leads' && (
          <div className="space-y-6">
            {/* Search Box Card */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 md:p-7 shadow-sm space-y-5">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold mb-2">
                  <span>▲ Apollo.io Verified Database Sync</span>
                </div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Search size={18} className="text-indigo-600" />
                  <span>Search Decision-Maker Leads</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Tell us what kind of leads you need. The AI will find high-intent contacts with verified direct phone numbers ready to download as a CSV or call automatically.
                </p>
              </div>

              <form onSubmit={handleGenerateLeads} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Business Category / Lead Type
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Luxury Real Estate Buyers, Dental Clinics, Homeowners"
                      value={nicheQuery}
                      onChange={(e) => setNicheQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Target City / Location
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dubai, Mumbai, Toronto, London"
                      value={locationQuery}
                      onChange={(e) => setLocationQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 transition"
                    />
                  </div>
                </div>

                {/* Number of Leads Selector (Min 10, Max 100) */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-2">
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
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/25'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {cnt} Leads
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 font-mono">
                    <Sparkles size={14} className="text-amber-500" />
                    <span>Includes Direct Mobile Numbers + AI Intent Scoring</span>
                  </div>

                  <button
                    type="submit"
                    disabled={generatingLeads}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white font-bold text-xs transition flex items-center gap-2 shadow-md shadow-indigo-600/25 cursor-pointer disabled:opacity-50"
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
            <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-sm space-y-4 p-5 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span>Generated Leads</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                      {leads.length} Available
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Verified contacts matching your search criteria.</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadCsv(leads)}
                    disabled={leads.length === 0}
                    className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-40"
                    title="Download all leads as a CSV spreadsheet"
                  >
                    <Download size={14} />
                    <span>Download CSV</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('auto_dialer')}
                    disabled={leads.length === 0}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20 disabled:opacity-40"
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
                      <tr className="border-b border-slate-200 text-[10px] font-mono uppercase text-slate-500 bg-slate-50/80">
                        <th className="py-2.5 px-3">Lead Contact</th>
                        <th className="py-2.5 px-3">Phone Number</th>
                        <th className="py-2.5 px-3">Company & Role</th>
                        <th className="py-2.5 px-3">City</th>
                        <th className="py-2.5 px-3 text-right">Intent Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {leads.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-900">{l.name}</div>
                            <div className="text-[10px] text-slate-500">{l.niche || 'Inquiry'}</div>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-800 font-bold">
                            <div className="flex items-center gap-2">
                              <span>{l.phone}</span>
                              <button
                                onClick={() => handleOpenWhatsAppModal(l)}
                                className="p-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer"
                                title="Send WhatsApp Brochure to this Lead"
                              >
                                <MessageSquare size={12} />
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="text-slate-800 font-medium">{l.company}</div>
                            <div className="text-[10px] text-slate-500">{l.role}</div>
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {l.city}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px]">
                              🔥 {l.intentScore}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No leads generated yet. Fill in the form above and click "Find Leads Now"!
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 2: UPLOAD CSV & AI AUTO-CALL (Light Theme)
            ========================================================= */}
        {activeTab === 'auto_dialer' && (
          <div className="space-y-6">
            {/* Top Action Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Option A: Upload CSV File */}
              <div className="bg-white border border-slate-200/90 hover:border-indigo-400 rounded-3xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 border border-indigo-200 shadow-xs">
                    <FileSpreadsheet size={22} />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-base">Upload Your Own Leads (CSV)</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Have your own lead list? Upload any CSV file with names and phone numbers. The AI will queue them for automated calling.
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
                    className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs border border-slate-200 transition flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
                  >
                    <Upload size={14} className="text-indigo-600" />
                    <span>Upload CSV Spreadsheet</span>
                  </button>
                </div>
              </div>

              {/* Option B: AI Calling Launcher */}
              <div className="bg-gradient-to-br from-indigo-50/80 to-purple-50/80 border border-indigo-200/90 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 border border-emerald-200 shadow-xs">
                    <PhoneCall size={22} />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-base">Launch Autonomous AI Calls</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    The AI calls each contact, introduces your business, answers questions using your pricing & FAQs, and books confirmed appointments!
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleBatchDial}
                    disabled={dialingBatch || leads.length === 0}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 cursor-pointer active:scale-95 disabled:opacity-50"
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
                  <div className="text-[11px] text-center text-slate-500 font-mono">
                    Allocated Minutes Remaining: <span className="text-emerald-700 font-bold">{minutesRemaining}m</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Leads In Calling Queue */}
            <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Leads In Queue ({leads.length})</h3>
                  <p className="text-xs text-slate-500">Select leads to dial, or click "Start AI Calling" to dial automatically.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadCsv(leads)}
                    disabled={leads.length === 0}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center gap-1.5 cursor-pointer shadow-xs"
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
                      <tr className="border-b border-slate-200 text-[10px] font-mono uppercase text-slate-500 bg-slate-50/80">
                        <th className="py-2.5 px-3">Select</th>
                        <th className="py-2.5 px-3">Contact</th>
                        <th className="py-2.5 px-3">Phone</th>
                        <th className="py-2.5 px-3">Company</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {leads.slice(0, 50).map(l => {
                        const isSelected = selectedLeadIds.includes(l.id);
                        return (
                          <tr key={l.id} className="hover:bg-slate-50/70">
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
                            <td className="py-3 px-3 font-semibold text-slate-900">
                              {l.name}
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-800 font-bold">
                              <div className="flex items-center gap-2">
                                <span>{l.phone}</span>
                                <button
                                  onClick={() => handleOpenWhatsAppModal(l)}
                                  className="p-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer"
                                  title="Send WhatsApp Brochure to this Lead"
                                >
                                <MessageSquare size={12} />
                              </button>
                            </div>
                          </td>
                            <td className="py-3 px-3 text-slate-600">
                              {l.company}
                            </td>
                            <td className="py-3 px-3">
                              {l.status === 'booked' ? (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[10px] uppercase font-mono">
                                  ✓ Appointment Booked
                                </span>
                              ) : l.status === 'contacted' ? (
                                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-mono font-semibold">
                                  Called
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-mono">
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
                <div className="text-center py-10 text-slate-400 text-xs">
                  Queue is empty. Go to "Search & Find Leads" or upload a CSV above!
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 3: CALL RECORDINGS & CONVERSATION SCRIPTS (Light Theme)
            ========================================================= */}
        {activeTab === 'recordings' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Volume2 size={18} className="text-indigo-600" />
                  <span>Call Voice Recordings & Transcripts</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Listen to voice recordings of calls handled by your 24/7 AI agent, with dialogue transcripts and automated follow-ups.
                </p>
              </div>

              {/* Inbound vs Outbound Filter */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto text-xs font-semibold">
                <button
                  onClick={() => setCallDirectionFilter('all')}
                  className={`px-3 py-1 rounded-lg transition ${
                    callDirectionFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({calls.length})
                </button>
                <button
                  onClick={() => setCallDirectionFilter('inbound')}
                  className={`px-3 py-1 rounded-lg transition flex items-center gap-1 ${
                    callDirectionFilter === 'inbound'
                      ? 'bg-cyan-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-cyan-700'
                  }`}
                >
                  <PhoneIncoming size={12} />
                  <span>24/7 Inbound ({calls.filter(c => c.direction === 'inbound').length})</span>
                </button>
                <button
                  onClick={() => setCallDirectionFilter('outbound')}
                  className={`px-3 py-1 rounded-lg transition flex items-center gap-1 ${
                    callDirectionFilter === 'outbound'
                      ? 'bg-indigo-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-indigo-700'
                  }`}
                >
                  <PhoneOutgoing size={12} />
                  <span>Outbound ({calls.filter(c => c.direction !== 'inbound').length})</span>
                </button>
              </div>
            </div>

            {calls.length > 0 ? (
              <div className="space-y-4">
                {calls
                  .filter(c => {
                    if (callDirectionFilter === 'inbound') return c.direction === 'inbound';
                    if (callDirectionFilter === 'outbound') return c.direction !== 'inbound';
                    return true;
                  })
                  .map((call) => {
                  const isExpanded = expandedCallId === call.id;
                  const isBooked = call.status === 'booked' || call.booking;

                  return (
                    <div 
                      key={call.id} 
                      className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition"
                    >
                      {/* Call Summary Bar */}
                      <div 
                        onClick={() => setExpandedCallId(isExpanded ? null : call.id)}
                        className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/60"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                            call.direction === 'inbound' 
                              ? 'bg-cyan-50 text-cyan-600 border border-cyan-200'
                              : isBooked 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                              : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                          }`}>
                            {call.direction === 'inbound' ? <PhoneIncoming size={20} /> : isBooked ? <Calendar size={20} /> : <PhoneCall size={20} />}
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-extrabold text-slate-900 text-sm">{call.customerName || 'Inquiry Contact'}</h4>
                              {call.direction === 'inbound' ? (
                                <span className="px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-800 font-bold text-[10px] font-mono border border-cyan-200 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
                                  📥 24/7 Inbound Receptionist
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px] font-mono border border-indigo-200">
                                  📤 Outbound Auto-Dialer
                                </span>
                              )}
                              {isBooked && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] font-mono border border-emerald-200">
                                  ✓ Appointment Confirmed
                                </span>
                              )}
                              <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-semibold">
                                {call.sentiment || 'Warm Lead'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-3 mt-1 font-mono">
                              <span className="text-slate-800 font-bold">{call.customerPhone}</span>
                              <span>•</span>
                              <span>Duration: {Math.floor((call.durationSeconds || 60) / 60)}m {(call.durationSeconds || 60) % 60}s</span>
                              <span>•</span>
                              <span className="text-slate-400">{new Date(call.createdAt || Date.now()).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 self-end md:self-auto">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenWhatsAppModal({
                                name: call.customerName,
                                phone: call.customerPhone,
                                callId: call.id
                              });
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                            title="Send Instant WhatsApp Brochure / Details"
                          >
                            <MessageSquare size={13} className="text-emerald-600" />
                            <span>WhatsApp</span>
                          </button>

                          <button 
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                          >
                            <span>{isExpanded ? 'Hide Script' : 'Listen & Read Script'}</span>
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded View: Audio Player & Script */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 bg-slate-50/70 p-5 space-y-4">
                          {/* 1. Voice Audio Player */}
                          <div>
                            <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-2">
                              <Volume2 size={14} className="text-indigo-600" />
                              <span>Call Audio Recording</span>
                            </div>
                            <AudioPlayer audioUrl={call.recordingUrl || 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=short-voice-note.mp3'} />
                          </div>

                          {/* 2. Full Conversation Dialogue Script */}
                          <div>
                            <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-2">
                              <FileSpreadsheet size={14} className="text-cyan-600" />
                              <span>Full Dialogue Script (Spoken Transcript)</span>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 max-h-72 overflow-y-auto shadow-xs">
                              {call.transcript && call.transcript.length > 0 ? (
                                call.transcript.map((line, idx) => (
                                  <div 
                                    key={idx}
                                    className={`flex items-start gap-2.5 ${
                                      line.speaker === 'ai' ? 'text-indigo-900' : 'text-slate-800'
                                    }`}
                                  >
                                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold shrink-0 mt-0.5 ${
                                      line.speaker === 'ai' 
                                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    }`}>
                                      {line.speaker === 'ai' ? '🤖 AI Agent' : '👤 Customer'}
                                    </span>
                                    <div className="text-xs leading-relaxed">
                                      {line.text}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-slate-500">
                                  {call.summary || 'Call completed successfully.'}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* 3. AI Takeaway Summary */}
                          {call.summary && (
                            <div className="bg-indigo-50/80 border border-indigo-100 rounded-2xl p-3.5 text-xs text-indigo-900 flex items-start gap-2.5">
                              <Sparkles size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                              <div>
                                <strong className="text-slate-900 block mb-0.5">AI Call Summary:</strong>
                                <span>{call.summary}</span>
                              </div>
                            </div>
                          )}

                          {/* 4. Automated Actions Dispatched (WhatsApp & Email) */}
                          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                <Send size={14} className="text-emerald-600" />
                                <span>Automated Follow-ups Dispatched</span>
                              </div>
                              <button
                                onClick={() => handleOpenWhatsAppModal({
                                  name: call.customerName,
                                  phone: call.customerPhone,
                                  callId: call.id
                                })}
                                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 cursor-pointer bg-white px-3 py-1 rounded-lg border border-emerald-200 shadow-xs"
                              >
                                <MessageSquare size={12} />
                                <span>Re-send / Trigger Custom WhatsApp</span>
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                              {/* WhatsApp Card */}
                              <div className="bg-white p-3.5 rounded-xl border border-emerald-200/70 space-y-1.5 shadow-xs">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-emerald-800 flex items-center gap-1.5 text-[11px]">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    WhatsApp Delivered
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400">
                                    {call.automations?.whatsapp?.sentAt 
                                      ? new Date(call.automations.whatsapp.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                      : 'Instant'}
                                  </span>
                                </div>
                                <div className="text-[11px] font-semibold text-slate-800">
                                  {call.automations?.whatsapp?.template || 'VIP Showroom Pass & Brochure PDF'}
                                </div>
                                <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 font-mono leading-relaxed">
                                  "{call.automations?.whatsapp?.preview || `Hi ${call.customerName?.split(' ')[0] || 'there'}! As confirmed on call with Sarah, here is your VIP Pass & Brochure: https://apexproperties.ae/brochure.pdf`}"
                                </p>
                              </div>

                              {/* Email Card */}
                              <div className="bg-white p-3.5 rounded-xl border border-indigo-200/70 space-y-1.5 shadow-xs">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-indigo-800 flex items-center gap-1.5 text-[11px]">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                    Email Delivered
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400">
                                    {call.automations?.email?.sentAt 
                                      ? new Date(call.automations.email.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                      : 'Instant'}
                                  </span>
                                </div>
                                <div className="text-[11px] font-semibold text-slate-800">
                                  {call.automations?.email?.template || 'Calendar (.ics) & Portfolio Presentation Deck'}
                                </div>
                                <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 font-mono leading-relaxed">
                                  "{call.automations?.email?.preview || `Confirmed VIP Walkthrough Slot: Sunday 11:00 AM. Attached: Apex_Portfolio_2026.pdf`}"
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 text-xs shadow-sm">
                No calls completed yet. Launch calls in the "Upload CSV & Auto-Call" tab to hear recordings here!
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            TAB 4: BUSINESS INFO & KNOWLEDGE (Light Theme)
            ========================================================= */}
        {activeTab === 'business_info' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Building2 size={18} className="text-indigo-600" />
                  <span>Update Business Information & AI Knowledge</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Keep your calling agent up to date! Add your latest services, prices, and answers to common customer questions.
                </p>
              </div>

              <button
                onClick={handleSaveKnowledge}
                disabled={savingKb}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs transition flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer self-start sm:self-auto"
              >
                {savingKb ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                <span>Save & Update Calling Agent</span>
              </button>
            </div>

            {/* Section 1: Business Overview */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900">About Your Business</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Company Description (What the AI tells prospects)</label>
                  <textarea
                    rows={3}
                    value={kbData.businessDescription}
                    onChange={(e) => setKbData({ ...kbData, businessDescription: e.target.value })}
                    placeholder="e.g. We are a premier luxury real estate agency in Dubai specializing in prime beachfront penthouses and high-yield villas..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 transition"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Office / Working Hours</label>
                    <input
                      type="text"
                      value={kbData.operatingHours}
                      onChange={(e) => setKbData({ ...kbData, operatingHours: e.target.value })}
                      placeholder="e.g. Monday - Saturday: 9:00 AM - 7:00 PM"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Office Address / Location</label>
                    <input
                      type="text"
                      value={kbData.location}
                      onChange={(e) => setKbData({ ...kbData, location: e.target.value })}
                      placeholder="e.g. Level 24, Marina Plaza, Dubai Marina"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Services & Pricing */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Services & Pricing Catalog</h3>
                  <p className="text-xs text-slate-500">The AI uses these exact prices and deliverables when quoting to customers.</p>
                </div>
              </div>

              {/* Add New Service Form */}
              <form onSubmit={handleAddService} className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <input
                  type="text"
                  required
                  placeholder="Service Name (e.g. 3BHK Penthouse)"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                />
                <input
                  type="text"
                  placeholder="Price (e.g. 4.2 Million AED)"
                  value={newServicePrice}
                  onChange={(e) => setNewServicePrice(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Deliverable / Brief Details"
                    value={newServiceDeliverable}
                    onChange={(e) => setNewServiceDeliverable(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
                  >
                    <Plus size={14} />
                    <span>Add</span>
                  </button>
                </div>
              </form>

              {/* Service List */}
              <div className="space-y-2">
                {kbData.services && kbData.services.length > 0 ? (
                  kbData.services.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{s.name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{s.deliverable}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                          {s.price}
                        </span>
                        <button
                          onClick={() => handleDeleteService(s.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition"
                          title="Delete service"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No services added yet. Add one above!</p>
                )}
              </div>
            </div>

            {/* Section 3: FAQs (Answers for AI) */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900">Common Questions & Answers (FAQs)</h3>
                <p className="text-xs text-slate-500">Teach your AI agent how to answer specific questions customers often ask.</p>
              </div>

              {/* Add FAQ Form */}
              <form onSubmit={handleAddFaq} className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <input
                  type="text"
                  required
                  placeholder="Customer Question (e.g. Do you offer virtual showroom tours on Zoom?)"
                  value={newFaqQ}
                  onChange={(e) => setNewFaqQ(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="AI Answer (e.g. Yes! We arrange live 3D walkthroughs over Zoom with our senior advisor.)"
                    value={newFaqA}
                    onChange={(e) => setNewFaqA(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
                  >
                    <Plus size={14} />
                    <span>Add</span>
                  </button>
                </div>
              </form>

              {/* FAQ List */}
              <div className="space-y-2">
                {kbData.faq && kbData.faq.length > 0 ? (
                  kbData.faq.map((f, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-indigo-900 font-bold">Q: {f.q}</strong>
                        <button
                          onClick={() => handleDeleteFaq(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="text-slate-600">A: {f.a}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No FAQs added yet.</p>
                )}
              </div>
            </div>

            {/* Section 4: WhatsApp & Email Follow-up Automation */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <MessageSquare size={16} className="text-emerald-600" />
                    <span>WhatsApp & Email Autonomous Follow-Up</span>
                  </h3>
                  <p className="text-xs text-slate-500">Configure the PDF brochure and WhatsApp message the AI dispatches when leads request it on call.</p>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                  ✓ Active Auto-Responder
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                    <FileText size={13} className="text-indigo-600" />
                    <span>Official PDF Brochure / Catalog URL</span>
                  </label>
                  <input
                    type="url"
                    value={kbData.brochureUrl || ''}
                    onChange={(e) => setKbData({ ...kbData, brochureUrl: e.target.value })}
                    placeholder="https://yourbrand.com/brochure.pdf"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Link sent automatically when customer says "Send brochure on WhatsApp"</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                    <Calendar size={13} className="text-indigo-600" />
                    <span>Calendar Booking Link (Cal.com / Google Calendar)</span>
                  </label>
                  <input
                    type="url"
                    value={kbData.calendarUrl || ''}
                    onChange={(e) => setKbData({ ...kbData, calendarUrl: e.target.value })}
                    placeholder="https://cal.com/your-brand/vip-meeting"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Shared automatically when appointment is locked on call</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                  <MessageSquare size={13} className="text-emerald-600" />
                  <span>Automated WhatsApp Message Template</span>
                </label>
                <textarea
                  rows={2}
                  value={kbData.whatsappTemplate || ''}
                  onChange={(e) => setKbData({ ...kbData, whatsappTemplate: e.target.value })}
                  placeholder="Hi {{name}}! Thank you for speaking with our AI advisor..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Variables supported: <code>{"{{name}}"}</code>, <code>{"{{company}}"}</code>, <code>{"{{link}}"}</code></span>
              </div>
            </div>

            {/* Section 5: 24/7 Inbound Call Forwarding & Receptionist Setup */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Headphones size={16} className="text-cyan-600" />
                    <span>24/7 Inbound Call Answering & Call Forwarding</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Handle incoming customer calls to your business line. AI answers on first ring, qualifies caller, and transfers if requested.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
                  Active 24/7
                </span>
              </div>

              {/* Call Forwarding Quick Guide */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
                <strong className="text-slate-900 font-bold block">
                  📲 How to Forward Calls from your Personal/Business Phone to AI:
                </strong>
                <p className="text-slate-600 leading-relaxed">
                  You don't need to change your existing SIM number. Simply dial the operator forward code on your mobile phone:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 font-mono text-[11px]">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">India (Jio / Airtel / Vi):</span>
                    <span className="text-indigo-700 font-bold">*61*{clientData?.assignedNumber || '+918048799695'}#</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Forwards if unanswered after 15s</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Dubai (Etisalat / Du):</span>
                    <span className="text-indigo-700 font-bold">*61*{clientData?.assignedNumber || '+97148219920'}#</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Forwards on busy or after hours</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Direct Virtual Line:</span>
                    <span className="text-emerald-700 font-bold">{clientData?.assignedNumber || '+971 4 821 9920'}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Put directly on Google / Website Ads</span>
                  </div>
                </div>
              </div>

              {/* Human Escalation Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                    <PhoneIncoming size={13} className="text-cyan-600" />
                    <span>Human Manager Transfer Number (Escalation)</span>
                  </label>
                  <input
                    type="text"
                    value={clientData?.phone || '+971 50 492 8819'}
                    readOnly
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    AI live patches caller to this mobile number if customer explicitly asks for human owner.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                    <Clock size={13} className="text-indigo-600" />
                    <span>Inbound Answering Hours</span>
                  </label>
                  <input
                    type="text"
                    value="24 Hours / 7 Days a Week (Never Sleeps)"
                    readOnly
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-emerald-700 font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Answers customer inquiries at night, weekends, and holidays.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Live Mic Test Call Modal (ToughTongue White-Labeled WebRTC) */}
      {liveVoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                  <Radio size={16} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Real-Time AI Voice Test Call</h3>
                  <p className="text-[11px] text-slate-500">Speak into your mic to test your calling agent</p>
                </div>
              </div>
              <button
                onClick={() => setLiveVoiceModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 flex flex-col items-center justify-center min-h-[360px] bg-slate-900">
              {liveIframeSrc ? (
                <iframe
                  src={liveIframeSrc}
                  allow="microphone; camera"
                  className="w-full h-[400px] rounded-2xl border border-slate-800 shadow-inner"
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

      {/* 1-Click WhatsApp Dispatch Modal */}
      {whatsAppModalOpen && whatsAppTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-emerald-50/80 border-b border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Send WhatsApp Follow-up</h3>
                  <p className="text-[11px] text-slate-500">Autonomous WhatsApp dispatch via Meta Cloud / Twilio</p>
                </div>
              </div>
              <button
                onClick={() => setWhatsAppModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-200/60 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendWhatsApp} className="p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Recipient Name:</span>
                  <span className="font-bold text-slate-900">{whatsAppTarget.name || 'Valued Lead'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">WhatsApp Number:</span>
                  <span className="font-mono font-bold text-emerald-700">{whatsAppTarget.phone}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Message Content (Will be delivered instantly):
                </label>
                <textarea
                  rows={4}
                  required
                  value={whatsAppCustomText}
                  onChange={(e) => setWhatsAppCustomText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 font-sans"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <a
                  href={`https://wa.me/${(whatsAppTarget.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsAppCustomText)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
                >
                  <ExternalLink size={13} />
                  <span>Open WhatsApp Web</span>
                </a>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setWhatsAppModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingWhatsApp}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                  >
                    {sendingWhatsApp ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    <span>{sendingWhatsApp ? 'Dispatching...' : 'Dispatch WhatsApp Now'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Success Toast */}
      {whatsAppSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 border border-emerald-500/50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">WhatsApp message successfully delivered to lead!</span>
        </div>
      )}

      {/* Inbound Call Simulation Success Toast */}
      {inboundSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-cyan-950 border border-cyan-500/50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom duration-200">
          <PhoneIncoming size={18} className="text-cyan-400 shrink-0 animate-bounce" />
          <div>
            <div className="text-xs font-bold">Incoming Call Answered by 24/7 AI Receptionist!</div>
            <div className="text-[11px] text-cyan-200">Customer inquiry resolved, appointment booked & WhatsApp sent.</div>
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
