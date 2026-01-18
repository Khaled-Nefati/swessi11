
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import MartyrsInquiry from './pages/MartyrsInquiry';
import AmputeesInquiry from './pages/AmputeesInquiry';
import BeneficiariesInquiry from './pages/BeneficiariesInquiry';
import UserManagement from './pages/UserManagement';
import OfficesManagement from './pages/OfficesManagement';
import Reports from './pages/Reports';
import Login from './pages/Login';
import { User, UserRole } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('app_session');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsInitializing(false);
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('app_session', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('app_session');
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#38bdf8] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <HashRouter>
      <div className="flex min-h-screen bg-[#020617] text-right overflow-hidden" dir="rtl">
        <Sidebar 
          isOpen={isSidebarOpen} 
          setIsOpen={setIsSidebarOpen} 
          userRole={user.role} 
          onLogout={handleLogout}
        />
        
        <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'mr-64' : 'mr-20'}`}>
          <Header user={user} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
          
          <main className="p-6 overflow-y-auto relative">
            <div className="relative z-10">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/martyrs" element={<MartyrsInquiry />} />
                <Route path="/amputees" element={<AmputeesInquiry />} />
                <Route path="/beneficiaries" element={<BeneficiariesInquiry />} />
                <Route path="/users" element={user.role === UserRole.ADMIN ? <UserManagement /> : <Navigate to="/" />} />
                <Route path="/offices" element={user.role === UserRole.ADMIN ? <OfficesManagement /> : <Navigate to="/" />} />
                <Route path="/reports" element={<Reports currentUser={user} />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </HashRouter>
  );
};

export default App;
