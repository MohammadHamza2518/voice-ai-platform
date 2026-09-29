import React, { useState, useEffect } from 'react';
import SuperAdmin from './components/SuperAdmin';
import ClientPortal from './components/ClientPortal';

export default function App() {
  const [route, setRoute] = useState('admin'); // Default to Admin Panel (Hamza's Agency Headquarters)
  const [selectedClientId, setSelectedClientId] = useState('client_apex_01');
  const [fromAdmin, setFromAdmin] = useState(false);

  useEffect(() => {
    // Listen to hash changes for deep linking
    const handleHashChange = () => {
      const hash = window.location.hash || '';
      
      if (hash.startsWith('#/portal/') || hash.startsWith('#/client/') || hash.startsWith('#/workspace/')) {
        const cleanHash = hash.replace(/^#\/(portal|client|workspace)\//, '');
        const [clientIdPart, queryPart] = cleanHash.split('?');
        const clientId = clientIdPart || 'client_apex_01';
        const isFromAdmin = queryPart ? queryPart.includes('from=admin') : false;
        
        setSelectedClientId(clientId);
        setFromAdmin(isFromAdmin);
        setRoute('client_portal');
      } else {
        // Default route is Agency Super Admin
        setRoute('admin');
        setFromAdmin(false);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateToClientPortal = (clientId) => {
    setSelectedClientId(clientId);
    setFromAdmin(true);
    setRoute('client_portal');
    window.location.hash = `#/portal/${clientId}?from=admin`;
  };

  const navigateToAdmin = () => {
    setRoute('admin');
    setFromAdmin(false);
    window.location.hash = '#/admin';
  };

  return (
    <div className="min-h-screen bg-[#05070D] flex flex-col font-sans text-slate-100">
      {route === 'admin' ? (
        <SuperAdmin 
          onSelectClientView={navigateToClientPortal} 
        />
      ) : (
        <ClientPortal 
          clientId={selectedClientId} 
          fromAdmin={fromAdmin}
          onBackToAdmin={navigateToAdmin}
        />
      )}
    </div>
  );
}
