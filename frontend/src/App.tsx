import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import BatchDetails from './pages/BatchDetails';
import Verify from './pages/Verify';
import ColdChain from './pages/ColdChain';
import Inventory from './pages/Inventory';
import Traceability from './pages/Traceability';
import SecureTerminal from './pages/SecureTerminal';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/traceability" element={<Traceability />} />
        <Route path="/batch/:batchId" element={<BatchDetails />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/cold-chain" element={<ColdChain />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/secure-terminal" element={<SecureTerminal />} />
      </Routes>
    </Router>
  );
};

export default App;
