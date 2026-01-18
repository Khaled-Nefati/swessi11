
import React, { useState } from 'react';
import { User, UserRole } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const demoUsers: Record<string, User> = {
    'admin': {
      id: '1', name: 'أحمد المحمودي', username: 'admin', role: UserRole.ADMIN,
      officeId: 'all', officeName: 'الإدارة العامة', categories: [],
      accessScope: 'all_offices', status: 'نشط',
      permissions: {
        martyrs: { view: true, edit: true, delete: true },
        amputees: { view: true, edit: true, delete: true },
        beneficiaries: { view: true, edit: true, delete: true },
        reports: { view: true, export: true },
        settings: { manageUsers: true, manageOffices: true }
      }
    },
    'manager': {
      id: '2', name: 'سالم الورفلي', username: 'manager', role: UserRole.MANAGER,
      officeId: 'off-1', officeName: 'مكتب طرابلس', categories: [],
      accessScope: 'office_only', status: 'نشط',
      permissions: {
        martyrs: { view: true, edit: true, delete: false },
        amputees: { view: true, edit: true, delete: false },
        beneficiaries: { view: true, edit: true, delete: false },
        reports: { view: true, export: true },
        settings: { manageUsers: false, manageOffices: false }
      }
    },
    'entry': {
      id: '3', name: 'خالد الفيتوري', username: 'entry', role: UserRole.ENTRY,
      officeId: 'off-1', officeName: 'مكتب طرابلس', categories: [],
      accessScope: 'office_only', status: 'نشط',
      permissions: {
        martyrs: { view: true, edit: true, delete: false },
        amputees: { view: true, edit: true, delete: false },
        beneficiaries: { view: true, edit: true, delete: false },
        reports: { view: true, export: false },
        settings: { manageUsers: false, manageOffices: false }
      }
    },
    'inquiry': {
      id: '4', name: 'منى الجبالي', username: 'inquiry', role: UserRole.INQUIRY,
      officeId: 'off-1', officeName: 'مكتب طرابلس', categories: [],
      accessScope: 'office_only', status: 'نشط',
      permissions: {
        martyrs: { view: true, edit: false, delete: false },
        amputees: { view: true, edit: false, delete: false },
        beneficiaries: { view: true, edit: false, delete: false },
        reports: { view: true, export: false },
        settings: { manageUsers: false, manageOffices: false }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      const foundUser = demoUsers[username.toLowerCase()];
      if (foundUser && password === '123') {
        onLogin(foundUser);
      } else {
        setError('اسم المستخدم أو كلمة المرور (123) غير صحيحة');
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#020617] relative overflow-hidden font-['Tajawal']" dir="rtl">
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-[#38bdf8]/10 rounded-full blur-[150px]"></div>
      
      <div className="relative z-10 w-full max-w-md p-4">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-[#0ea5e9] to-[#38bdf8] rounded-2xl shadow-xl shadow-[#38bdf8]/20 mx-auto flex items-center justify-center mb-6">
            <i className="fas fa-shield-halved text-[#020617] text-4xl"></i>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">منظومة الرعاية الوطنية</h1>
          <p className="text-[#38bdf8] font-bold text-sm">بوابة الوصول الموحدة للموظفين</p>
        </div>

        <div className="bg-[#0f172a]/60 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs font-bold">{error}</div>}
            
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase mr-1 text-right block">اسم المستخدم</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-[#1e293b]/50 border border-white/5 rounded-xl py-4 px-5 text-white outline-none focus:border-[#38bdf8]/50 font-bold text-center" placeholder="admin / manager / entry / inquiry" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase mr-1 text-right block">كلمة المرور</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-[#1e293b]/50 border border-white/5 rounded-xl py-4 px-5 text-white outline-none focus:border-[#38bdf8]/50 font-bold text-center" placeholder="123" />
            </div>

            <button type="submit" disabled={isLoading} className="w-full bg-[#38bdf8] text-[#020617] rounded-xl py-4 font-black shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-3">
              {isLoading ? <div className="w-5 h-5 border-2 border-[#020617]/30 border-t-[#020617] rounded-full animate-spin"></div> : "تسجيل الدخول"}
            </button>

            <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-2 gap-2">
               {Object.keys(demoUsers).map(u => (
                 <button key={u} type="button" onClick={() => { setUsername(u); setPassword('123'); }} className="text-[10px] bg-white/5 hover:bg-[#38bdf8]/20 p-2 rounded-lg text-slate-400 hover:text-[#38bdf8] transition-all font-bold">
                   دخول {demoUsers[u].role}
                 </button>
               ))}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
