
import React from 'react';
import { NavLink } from 'react-router-dom';
import { UserRole } from '../types';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  userRole: UserRole;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, userRole, onLogout }) => {
  const menuItems = [
    { path: '/', icon: 'fa-chart-line', label: 'لوحة التحكم' },
    { path: '/martyrs', icon: 'fa-user-check', label: 'الشهداء' },
    { path: '/amputees', icon: 'fa-user-injured', label: 'المبتورين' },
    { path: '/beneficiaries', icon: 'fa-users-rectangle', label: 'المستفيدين' },
    { path: '/reports', icon: 'fa-file-signature', label: 'التقارير' },
  ];

  if (userRole === UserRole.ADMIN) {
    menuItems.push({ path: '/offices', icon: 'fa-building-columns', label: 'إدارة المكاتب' });
    menuItems.push({ path: '/users', icon: 'fa-user-gear', label: 'إدارة المستخدمين' });
  }

  return (
    <div className={`fixed inset-y-0 right-0 z-50 bg-[#0f172a] text-white transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'} shadow-2xl overflow-hidden border-l border-white/5`}>
      <div className="flex items-center justify-center h-20 bg-[#1e293b] border-b border-white/5">
        <i className="fas fa-shield-halved text-[#38bdf8] text-3xl"></i>
        {isOpen && <span className="mr-3 font-black text-lg whitespace-nowrap text-white">منظومة الرعاية</span>}
      </div>

      <nav className="mt-8 space-y-2 px-3">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `flex items-center p-3 rounded-xl transition-all duration-200 group ${
                isActive ? 'bg-[#38bdf8] text-[#0f172a] shadow-lg font-black shadow-[#38bdf8]/20' : 'text-slate-400 hover:bg-[#1e293b] hover:text-[#38bdf8]'
              }`
            }
          >
            <div className="w-8 flex justify-center">
              <i className={`fas ${item.icon} text-lg`}></i>
            </div>
            {isOpen && <span className="mr-4 font-bold">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="absolute bottom-8 w-full px-3">
        <button 
          onClick={onLogout}
          className="w-full flex items-center p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors group"
        >
          <div className="w-8 flex justify-center">
            <i className="fas fa-power-off text-lg group-hover:scale-110 transition-transform"></i>
          </div>
          {isOpen && <span className="mr-4 font-bold">تسجيل الخروج</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
