
import React from 'react';
import { useLocation } from 'react-router-dom';
import { User } from '../types';

interface HeaderProps {
  user: User;
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, toggleSidebar }) => {
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'لوحة المعلومات الرئيسية';
      case '/martyrs': return 'سجل الشهداء';
      case '/amputees': return 'سجل المبتورين';
      case '/beneficiaries': return 'سجل المستفيدين';
      case '/users': return 'إدارة المستخدمين والصلاحيات';
      case '/reports': return 'التقارير والإحصائيات';
      case '/offices': return 'إدارة المكاتب الإقليمية';
      default: return 'المنظومة';
    }
  };

  return (
    <header className="h-20 bg-[#0f172a]/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 hover:bg-[#38bdf8]/10 rounded-lg text-[#38bdf8] transition-colors"
        >
          <i className="fas fa-bars-staggered text-xl"></i>
        </button>
        <h1 className="text-xl font-black text-white hidden md:block border-r-2 border-[#38bdf8] pr-4">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex gap-4 items-center">
           <button className="relative p-2 text-slate-400 hover:text-[#38bdf8] transition-colors">
            <i className="fas fa-bell text-xl"></i>
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#38bdf8] rounded-full border-2 border-[#0f172a]"></span>
          </button>
        </div>

        <div className="h-8 w-px bg-white/10"></div>

        <div className="flex items-center gap-3">
          <div className="text-left hidden sm:block">
            <p className="text-sm font-black text-white text-right mb-0.5">{user.name}</p>
            <p className="text-[10px] text-[#38bdf8] font-bold text-right tracking-tight">{user.role}</p>
          </div>
          <div className="w-10 h-10 bg-[#38bdf8] rounded-full flex items-center justify-center text-[#0f172a] font-black shadow-lg shadow-[#38bdf8]/20">
            {user.name.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
