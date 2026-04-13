import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import BulkManagement from './pages/BulkManagement';
import Warehouse from './pages/Warehouse';
import Dispensing from './pages/Dispensing';
import Dispatch from './pages/Dispatch';
import Movements from './pages/Movements';
import Settings from './pages/Settings';

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/bulk" element={<BulkManagement />} />
          <Route path="/warehouse" element={<Warehouse />} />
          <Route path="/dispensing" element={<Dispensing />} />
          <Route path="/dispatch" element={<Dispatch />} />
          <Route path="/movements" element={<Movements />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;