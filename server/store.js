import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

let mongoClient = null;
let mongoDb = null;
let isMongoConnected = false;

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial realistic enterprise data
const initialData = {
  settings: {
    vapiApiKey: process.env.VAPI_API_KEY || '',
    vapiPhoneNumberId: process.env.VAPI_PHONE_NUMBER_ID || '',
    toughTongueApiKey: process.env.TOUGHTONGUE_API_KEY || 'vDOi7KxceJMvUHjLOvS_wF7uAxZb2Cgehvj30dltpNQ',
    agencyName: 'Synthetix AI Telecom',
    agencySupportEmail: 'hamza@synthetix.ai',
    currency: 'AED' // or INR
  },
  clients: [
    {
      id: 'client_apex_01',
      name: 'Apex Luxury Properties Dubai',
      slug: 'apex-luxury',
      logo: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=120&auto=format&fit=crop&q=80',
      industry: 'Luxury Real Estate',
      contactPerson: 'Farhan Tariq (Director of Global Sales)',
      email: 'sales@apexproperties.ae',
      phone: '+971 50 492 8819',
      assignedNumber: '+971 4 821 9920',
      toughTongueScenarioId: '6abbefa48b398e50c7c059dd',
      monthlyRetainer: '2,500 AED/mo',
      country: 'dubai',
      currency: 'AED',
      planTier: 'Enterprise Dedicated Trunk',
      carrier: 'e& (Etisalat) Direct SIP Trunk',
      sipTrunkStatus: 'Operational (42ms)',
      crmIntegration: 'Salesforce Enterprise (Synced)',
      allocatedMinutes: 1500,
      usedMinutes: 486,
      status: 'active',
      createdAt: '2026-08-15T09:00:00Z'
    },
    {
      id: 'client_zenith_02',
      name: 'Zenith Aesthetic & Hair Clinic',
      slug: 'zenith-clinic',
      logo: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=120&auto=format&fit=crop&q=80',
      industry: 'Specialized Healthcare / Aesthetics',
      contactPerson: 'Dr. Sameer Kapoor (Medical Director)',
      email: 'director@zenithclinic.in',
      phone: '+91 98201 44821',
      assignedNumber: '+91 80 4719 3320',
      toughTongueScenarioId: '6abbefb8077df1a1f09c02e1',
      monthlyRetainer: '₹25,000/mo',
      country: 'india',
      currency: 'INR',
      planTier: 'Growth High-Volume SLA',
      carrier: 'Tata Communications Enterprise PRI',
      sipTrunkStatus: 'Operational (58ms)',
      crmIntegration: 'LeadSquared Healthcare CRM',
      allocatedMinutes: 1000,
      usedMinutes: 312,
      status: 'active',
      createdAt: '2026-08-28T14:30:00Z'
    },
    {
      id: 'client_maple_03',
      name: 'Maple Ridge Realty & Condos Toronto',
      slug: 'maple-ridge-toronto',
      logo: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=120&auto=format&fit=crop&q=80',
      industry: 'Real Estate & Master-Planned Developments',
      contactPerson: 'Michael Tremblay (Broker of Record)',
      email: 'sales@mapleridgerealty.ca',
      phone: '+1 416 892 4100',
      assignedNumber: '+1 647 800 2931',
      monthlyRetainer: '$2,200 CAD/mo',
      country: 'canada',
      currency: 'CAD',
      planTier: 'Enterprise STIR/SHAKEN Level A',
      carrier: 'Telus / Bandwidth Direct Interconnect',
      sipTrunkStatus: 'Operational (35ms)',
      crmIntegration: 'HubSpot Enterprise Real Estate',
      allocatedMinutes: 1200,
      usedMinutes: 215,
      status: 'active',
      createdAt: '2026-09-01T11:00:00Z'
    }
  ],
  agents: [
    {
      id: 'agent_apex_01',
      clientId: 'client_apex_01',
      name: 'Sarah (Luxury Property Qualifier)',
      role: 'Outbound Speed-to-Lead & Inbound Receptionist',
      voiceProvider: 'Cartesia Sonic (British/Neutral English - 90ms)',
      voiceId: 'sonic-en-british-neutral',
      languageMode: 'english_dubai',
      transcriberLanguage: 'en',
      model: 'openai/gpt-4o-mini',
      vapiAssistantId: 'asst_apex_live_44',
      firstMessage: 'Good afternoon! This is Sarah from Apex Luxury Properties. I noticed you just inquired about our 3BHK residences at Dubai Marina. Do you have 60 seconds for a quick update?',
      systemPrompt: `You are Sarah, an elite and courteous senior sales consultant at Apex Luxury Properties Dubai.
Your primary objective is NOT to close the deal, but to QUALIFY the lead and SECURE a site visit or VIP Zoom consultation with the Managing Director.

Key Rules:
1. Always maintain a calm, prestigious, and articulate British/International tone.
2. Ask one question at a time.
3. Qualify 3 criteria:
   - Purpose: End-use (living) or pure investment (ROI)?
   - Budget range: Under 2M AED, 2M - 4M AED, or 4M+ Ultra-luxury?
   - Timeline: Ready to move in or off-plan 2026/2027?
4. When qualified, immediately lock a calendar slot: Saturday 11:00 AM or Sunday 4:00 PM.
5. If customer is rude or not interested, politely end call without arguing.`,
      routing: {
        inboundDestination: 'ai_agent',
        fallbackNumber: '+971 50 492 8819',
        transferOnHotLead: true
      },
      status: 'deployed'
    },
    {
      id: 'agent_zenith_02',
      clientId: 'client_zenith_02',
      name: 'Priya (Clinic Front-Desk & Consultation Setter)',
      role: 'Inbound 24/7 Receptionist & Lead Qualifier',
      voiceProvider: 'Deepgram Aura Priya (Indian English / Hinglish)',
      voiceId: 'aura-priya-en-in',
      languageMode: 'hinglish_india',
      transcriberLanguage: 'hi-Latn',
      model: 'openai/gpt-4o-mini',
      vapiAssistantId: 'asst_zenith_live_89',
      firstMessage: 'Namaste! Zenith Aesthetic Clinic mein aapka swagat hai. Main Priya baat kar rahi hoon. Main aapki kya sahayata kar sakti hoon?',
      systemPrompt: `You are Priya, the head patient coordinator at Zenith Aesthetic & Hair Clinic.
Speak in polite, empathetic Indian English with natural Hinglish warmth.

Goal:
1. Greet the patient with utmost respect.
2. Identify the treatment interested in (Hair Transplant, PRP, Skin Glow Laser, Botox).
3. Explain that Dr. Sameer conducts a thorough computerized 3D scalp/skin analysis.
4. Book an in-clinic consultation for ₹500 (waived if treatment confirmed).
5. Capture patient name and preferred morning/evening slot.`,
      routing: {
        inboundDestination: 'ai_agent',
        fallbackNumber: '+91 98201 44821',
        transferOnHotLead: false
      },
      status: 'deployed'
    },
    {
      id: 'agent_maple_03',
      clientId: 'client_maple_03',
      name: 'Chloe (Canadian Property Advisor)',
      role: 'Inbound & Outbound Showing Coordinator',
      voiceProvider: 'ElevenLabs Turbo v2.5 (Canadian / North American Friendly)',
      voiceId: 'turbo-en-ca-friendly',
      languageMode: 'english_canada',
      transcriberLanguage: 'en-US',
      model: 'openai/gpt-4o-mini',
      vapiAssistantId: 'asst_maple_live_12',
      firstMessage: 'Hi there! This is Chloe calling from Maple Ridge Realty Toronto. Thanks for checking out our new pre-construction condo release! Do you have a quick minute to chat about your search?',
      systemPrompt: `You are Chloe, an approachable, highly knowledgeable, and polite senior client advisor at Maple Ridge Realty Toronto.
Speak in natural, warm, and friendly Canadian / North American English.
Target Audience: Toronto & GTA homebuyers, first-time buyers, and Canadian real estate investors.

Key Objectives:
1. Always maintain a warm, welcoming, and professional Canadian tone (use natural phrases like "Hi there", "Thanks for taking my call", "Awesome", "Sounds great").
2. Ask one clear question at a time to qualify:
   - What type of property: Pre-construction condo or move-in ready detached/townhouse?
   - Target area: Downtown Toronto, Mississauga, Markham, or broader GTA?
   - Budget range in CAD: $600k-$900k, $1M-$1.5M, or $1.8M+ luxury?
   - Mortgage status: Pre-approved with a Canadian Big 5 bank or looking for a broker referral?
3. Lock an appointment: Book a 15-minute 1-on-1 VIP Video Consultation or Private Open House Showing for Saturday at 2:00 PM EST.
4. If they need floor plans or pricing sent, confirm their email and phone for instant PDF dispatch.`,
      routing: {
        inboundDestination: 'ai_agent',
        fallbackNumber: '+1 416 892 4100',
        transferOnHotLead: true
      },
      status: 'deployed'
    }
  ],
  calls: [
    {
      id: 'call_live_9925',
      clientId: 'client_maple_03',
      agentId: 'agent_maple_03',
      direction: 'outbound',
      customerName: 'Liam MacLeod',
      customerPhone: '+1 416 772 9014',
      durationSeconds: 142,
      status: 'booked',
      sentiment: 'High Intent',
      recordingUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=short-voice-note.mp3',
      summary: 'Canadian lead interested in Downtown Toronto 2-Bedroom pre-construction condo. Budget $850,000 CAD. Pre-approved with TD Canada Trust. Confirmed private presentation gallery showing for Saturday at 2:00 PM EST.',
      booking: {
        slot: 'Saturday, 2:00 PM EST',
        type: 'Private Presentation Gallery Walkthrough',
        verified: true
      },
      transcript: [
        { speaker: 'ai', time: '00:01', text: 'Hi there! This is Chloe calling from Maple Ridge Realty Toronto. Thanks for checking out our new pre-construction release! Do you have a quick minute to chat about your search?' },
        { speaker: 'customer', time: '00:08', text: 'Hey Chloe, yes I have a minute. Are the 2-bedroom floor plans with parking still available under $900k?' },
        { speaker: 'ai', time: '00:16', text: 'Great news Liam! We still have a select release of high-floor 2-bedroom corner suites starting from $849,000 CAD, including EV-ready parking and extended deposit structures.' },
        { speaker: 'customer', time: '00:27', text: 'That sounds really promising. We are looking to lock in before prices hike next month.' },
        { speaker: 'ai', time: '00:33', text: 'Totally understand. The developer incentives end this Sunday. Would you like to come by our presentation center this Saturday at 2:00 PM EST for a private walkthrough and to review the floor plans?' },
        { speaker: 'customer', time: '00:46', text: 'Saturday 2 PM works great for my wife and me.' },
        { speaker: 'ai', time: '00:50', text: 'Awesome! Saturday at 2:00 PM EST is booked for you Liam. I just sent the VIP access pass and address directly to your text message. Have a fantastic day!' }
      ],
      createdAt: '2026-09-29T11:05:00Z'
    },
    {
      id: 'call_live_9921',
      clientId: 'client_apex_01',
      agentId: 'agent_apex_01',
      direction: 'outbound',
      customerName: 'Rashid Al-Maktoum',
      customerPhone: '+971 50 839 2102',
      durationSeconds: 154,
      status: 'booked',
      sentiment: 'Highly Interested',
      recordingUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=short-voice-note.mp3',
      summary: 'Customer submitted Meta ad lead 40 seconds prior. Looking for a 3BHK corner unit in Dubai Marina for family relocation. Pre-approved mortgage with Emirates NBD (budget 2.8M AED). Confirmed in-person VIP showroom visit for Sunday at 11:00 AM.',
      booking: {
        slot: 'Sunday, 11:00 AM',
        type: 'VIP Showroom Tour & Financial Counseling',
        verified: true
      },
      transcript: [
        { speaker: 'ai', time: '00:01', text: 'Good afternoon Rashid! This is Sarah from Apex Luxury Properties. I noticed you just inquired about our 3BHK residences at Dubai Marina. Do you have 60 seconds for a quick update?' },
        { speaker: 'customer', time: '00:08', text: 'Yes, hi Sarah. That was fast! I just submitted the form. What is the starting price for the 3BHK?' },
        { speaker: 'ai', time: '00:15', text: 'Our high-floor 3BHK residences with marina views start from 2.6 Million AED. May I ask, are you planning this for your family residence or as a rental investment?' },
        { speaker: 'customer', time: '00:26', text: 'For myself and family. We are relocating from London next month.' },
        { speaker: 'ai', time: '00:32', text: 'Welcome to Dubai in advance! Since you are moving soon, our ready-to-move sample units are open this weekend. Would Saturday 3 PM or Sunday 11 AM suit you best for a private walkthrough with our sales director?' },
        { speaker: 'customer', time: '00:46', text: 'Sunday 11 AM works perfectly for me.' },
        { speaker: 'ai', time: '00:50', text: 'Wonderful Rashid. Sunday at 11:00 AM is confirmed. I am sending the Google Maps location pin and complete brochure to your WhatsApp right now. We look forward to meeting you!' }
      ],
      createdAt: '2026-09-29T10:14:20Z'
    },
    {
      id: 'call_live_9920',
      clientId: 'client_apex_01',
      agentId: 'agent_apex_01',
      direction: 'inbound',
      customerName: 'Marcus Sterling',
      customerPhone: '+44 7700 900321',
      durationSeconds: 112,
      status: 'callback',
      sentiment: 'Warm',
      recordingUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=short-voice-note.mp3',
      summary: 'UK Investor calling to enquire about rental yields on studio and 1BHK off-plan options. Currently in a meeting, requested callback via WhatsApp with ROI projection sheet.',
      booking: null,
      transcript: [
        { speaker: 'ai', time: '00:01', text: 'Thank you for calling Apex Luxury Properties. My name is Sarah. How may I assist you with Dubai property investments today?' },
        { speaker: 'customer', time: '00:07', text: 'Hello, what kind of net ROI are you seeing on the off-plan units right now?' },
        { speaker: 'ai', time: '00:12', text: 'We are averaging between 8.4% to 9.2% net rental yields in our Marina and Business Bay portfolios with flexible post-handover payment plans.' },
        { speaker: 'customer', time: '00:23', text: 'Brilliant. I am stepping into a client meeting right now. Can you have someone send the ROI projections to this UK number on WhatsApp?' },
        { speaker: 'ai', time: '00:31', text: 'Absolutely Marcus. I have noted down your request. Our senior investment desk will message you the PDF projections within 15 minutes.' }
      ],
      createdAt: '2026-09-29T09:40:15Z'
    },
    {
      id: 'call_live_9918',
      clientId: 'client_apex_01',
      agentId: 'agent_apex_01',
      direction: 'outbound',
      customerName: 'Sunil Mehta',
      customerPhone: '+91 98200 11928',
      durationSeconds: 42,
      status: 'unqualified',
      sentiment: 'Low Intent',
      recordingUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=short-voice-note.mp3',
      summary: 'Lead budget was 40 Lakhs INR (~175k AED). Property portfolio minimum starts at 1.8M AED. AI politely advised out of portfolio criteria and saved sales team from wasting 20 minutes.',
      booking: null,
      transcript: [
        { speaker: 'ai', time: '00:01', text: 'Hello Sunil, Sarah from Apex Luxury Properties. You submitted an inquiry regarding Dubai investments?' },
        { speaker: 'customer', time: '00:06', text: 'Yes, I wanted to know if I can buy a flat in Dubai for 40 Lakhs rupees.' },
        { speaker: 'ai', time: '00:12', text: 'Thank you for your interest Sunil. Currently our luxury freehold inventory starts from 1.8 Million AED (around 4 Crore INR). We do not have inventory in that range today, but we will keep your contact on file if entry-level projects open.' }
      ],
      createdAt: '2026-09-29T08:22:00Z'
    },
    {
      id: 'call_live_9915',
      clientId: 'client_zenith_02',
      agentId: 'agent_zenith_02',
      direction: 'inbound',
      customerName: 'Ananya Sharma',
      customerPhone: '+91 99102 33410',
      durationSeconds: 138,
      status: 'booked',
      sentiment: 'High Intent',
      recordingUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=short-voice-note.mp3',
      summary: 'Inquiry regarding Laser Hair Reduction & Skin Glow treatment before wedding next month. Booked consultation for Thursday 5:30 PM with Dr. Sameer.',
      booking: {
        slot: 'Thursday, 5:30 PM',
        type: 'Bridal Skin & Laser Assessment',
        verified: true
      },
      transcript: [
        { speaker: 'ai', time: '00:01', text: 'Namaste! Zenith Aesthetic Clinic mein aapka swagat hai. Main Priya baat kar rahi hoon. Main aapki kya sahayata kar sakti hoon?' },
        { speaker: 'customer', time: '00:09', text: 'Hi Priya, meri next month wedding hai aur mujhe full body laser hair reduction aur skin facial sessions ke rates janne the.' },
        { speaker: 'ai', time: '00:18', text: 'Congratulations Ananya ji! Bridal packages ke liye Dr. Sameer Kapoor pehle ek complimentary skin patch-test aur session plan design karte hain. Kya aap Thursday evening 5:30 PM consultation ke liye clinic visit kar sakti hain?' },
        { speaker: 'customer', time: '00:31', text: 'Haan, Thursday 5:30 PM perfectly fine hai.' },
        { speaker: 'ai', time: '00:36', text: 'Superb! Aapka Thursday 5:30 PM ka slot reserve ho gaya hai. Main clinic location pin aur bridal prep guidelines abhi WhatsApp kar rahi hoon.' }
      ],
      createdAt: '2026-09-29T07:15:10Z'
    }
  ]
};

class Store {
  constructor() {
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.data = initialData;
        this.save();
      }
    } catch (e) {
      console.error('Error loading store, using initial data:', e);
      this.data = initialData;
    }
  }

  async initMongo(uri) {
    if (!uri) return;
    try {
      mongoClient = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000
      });
      await mongoClient.connect();
      mongoDb = mongoClient.db('voice_ai_platform');
      isMongoConnected = true;
      console.log('🍃 MongoDB Atlas Connected! Collection: voice_store');

      // Check if main_store exists
      const doc = await mongoDb.collection('voice_store').findOne({ _id: 'main_store' });
      if (doc && doc.data) {
        this.data = { ...this.data, ...doc.data };
        console.log('🍃 Loaded persistent data from MongoDB Atlas! Clients:', this.data.clients?.length);
      } else {
        // Initial seed into Atlas
        await mongoDb.collection('voice_store').updateOne(
          { _id: 'main_store' },
          { $set: { data: this.data, updatedAt: new Date() } },
          { upsert: true }
        );
        console.log('🍃 Seeded initial store into MongoDB Atlas!');
      }
    } catch (err) {
      console.warn('⚠️ MongoDB Atlas connection error (using local disk fallback):', err.message);
      isMongoConnected = false;
    }
  }

  getMongoStatus() {
    return {
      connected: isMongoConnected,
      database: 'voice_ai_platform',
      collection: 'voice_store'
    };
  }

  save() {
    try {
      fs.writeFileSync(STORE_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving store:', e);
    }

    if (isMongoConnected && mongoDb) {
      mongoDb.collection('voice_store').updateOne(
        { _id: 'main_store' },
        { $set: { data: this.data, updatedAt: new Date() } },
        { upsert: true }
      ).catch(err => {
        console.error('Error syncing to MongoDB Atlas:', err.message);
      });
    }
  }

  getClients() {
    return this.data.clients || [];
  }

  getClientById(id) {
    return this.data.clients.find(c => c.id === id);
  }

  addClient(client) {
    this.data.clients.unshift(client);
    this.save();
    return client;
  }

  updateClient(id, updates) {
    const idx = this.data.clients.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.data.clients[idx] = { ...this.data.clients[idx], ...updates };
      this.save();
      return this.data.clients[idx];
    }
    return null;
  }

  getAgents() {
    return this.data.agents || [];
  }

  getAgentByClientId(clientId) {
    return this.data.agents.find(a => a.clientId === clientId);
  }

  saveAgent(agent) {
    const idx = this.data.agents.findIndex(a => a.id === agent.id);
    if (idx !== -1) {
      this.data.agents[idx] = { ...this.data.agents[idx], ...agent };
    } else {
      this.data.agents.unshift(agent);
    }
    this.save();
    return agent;
  }

  getCalls(clientId = null) {
    if (clientId) {
      return (this.data.calls || []).filter(c => c.clientId === clientId);
    }
    return this.data.calls || [];
  }

  addCall(call) {
    this.data.calls.unshift(call);
    // Deduct minutes from client
    if (call.clientId && call.durationSeconds) {
      const minutes = Math.ceil(call.durationSeconds / 60);
      const client = this.getClientById(call.clientId);
      if (client) {
        client.usedMinutes = (client.usedMinutes || 0) + minutes;
      }
    }
    this.save();
    return call;
  }

  getSettings() {
    return this.data.settings;
  }

  updateSettings(settings) {
    this.data.settings = { ...this.data.settings, ...settings };
    this.save();
    return this.data.settings;
  }

  getLeads(clientId) {
    if (!this.data.leads) this.data.leads = {};
    return this.data.leads[clientId] || [];
  }

  saveLeads(clientId, leads) {
    if (!this.data.leads) this.data.leads = {};
    this.data.leads[clientId] = leads;
    this.save();
    return this.data.leads[clientId];
  }

  updateLead(clientId, leadId, updates) {
    if (!this.data.leads || !this.data.leads[clientId]) return null;
    const idx = this.data.leads[clientId].findIndex(l => l.id === leadId);
    if (idx !== -1) {
      this.data.leads[clientId][idx] = { ...this.data.leads[clientId][idx], ...updates };
      this.save();
      return this.data.leads[clientId][idx];
    }
    return null;
  }

  clearLeads(clientId) {
    if (!this.data.leads) this.data.leads = {};
    this.data.leads[clientId] = [];
    this.save();
    return [];
  }
}

export const store = new Store();
