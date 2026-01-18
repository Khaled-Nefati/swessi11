
import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiService } from '../services/apiService';
import { User, UserRole } from '../types';

const Dashboard: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [statsData, setStatsData] = useState({
    martyrsCount: 0,
    beneficiariesCount: 0,
    amputeesCount: 0,
    totalBenefits: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('app_session');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setCurrentUser(parsedUser);
      fetchAllData(parsedUser);
    }
  }, []);

  const fetchAllData = async (user: User | null) => {
    try {
      setLoading(true);
      const [martyrs, amputees, beneficiaries] = await Promise.all([
        apiService.getMartyrs(),
        apiService.getAmputees(),
        apiService.getBeneficiaries()
      ]);

      const filterByScope = (list: any[]) => {
        if (!user || user.accessScope === 'all_offices' || user.role === UserRole.ADMIN) return list;
        return list.filter(item => item.office === user.officeName);
      };

      const fMartyrs = filterByScope(martyrs);
      const fAmputees = filterByScope(amputees);
      
      // لفلترة المستفيدين: إذا كان المستخدم يتبع مكتباً معيناً، نظهر له مستفيدي شهداء مكتبه
      const fBeneficiaries = beneficiaries.filter(b => {
        if (!user || user.accessScope === 'all_offices' || user.role === UserRole.ADMIN) return true;
        return fMartyrs.some(m => m.fullName === b.martyrName);
      });

      setStatsData({
        martyrsCount: fMartyrs.length,
        amputeesCount: fAmputees.length,
        beneficiariesCount: fBeneficiaries.length,
        totalBenefits: fBeneficiaries.reduce((acc: number, b: any) => acc + (b.lastGrantAmount || 0), 0)
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: 'سجل الشهداء', value: statsData.martyrsCount, icon: 'fa-user-check', color: 'text-blue-400' },
    { label: 'سجل المستفيدين', value: statsData.beneficiariesCount, icon: 'fa-users-rectangle', color: 'text-cyan-400' },
    { label: 'سجل المبتورين', value: statsData.amputeesCount, icon: 'fa-user-injured', color: 'text-sky-400' },
    { label: 'إجمالي المنح (د.ل)', value: statsData.totalBenefits.toLocaleString(), icon: 'fa-wallet', color: 'text-emerald-400' },
  ];

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#38bdf8] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fadeIn text-right" dir="rtl">
      <div className="bg-[#0f172a]/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row justify-between items-center shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 bg-[#38bdf8]/10 rounded-full blur-[60px] -mr-16 -mt-16"></div>
         <div className="relative z-10 text-center md:text-right">
            <h2 className="text-3xl font-black text-white">مرحباً بك، {currentUser?.name}</h2>
            <p className="text-[#38bdf8] font-bold mt-2 flex items-center gap-2 justify-center md:justify-start">
               <i className="fas fa-id-card-clip"></i>
               {currentUser?.role} - <span className="text-white/60">{currentUser?.officeName}</span>
            </p>
         </div>
         <div className="mt-6 md:mt-0 bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">حالة النظام الآن</p>
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
               <p className="text-white font-mono font-black">{new Date().toLocaleTimeString('ar-LY')}</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-[#1e293b]/50 backdrop-blur-md p-8 rounded-3xl border border-white/5 hover:border-[#38bdf8]/30 hover:bg-[#1e293b]/80 transition-all group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-500 text-[10px] font-black uppercase mb-2 tracking-widest">{stat.label}</p>
                <h3 className="text-3xl font-black text-white group-hover:scale-105 transition-transform origin-right">{stat.value}</h3>
              </div>
              <div className={`w-14 h-14 bg-[#0f172a] flex items-center justify-center ${stat.color} rounded-2xl border border-white/5 shadow-xl`}>
                <i className={`fas ${stat.icon} text-2xl`}></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 bg-[#1e293b]/30 p-10 rounded-[3rem] border border-white/5 h-[400px] relative">
            <h4 className="text-white font-black mb-8 flex items-center gap-2">
               <i className="fas fa-chart-area text-[#38bdf8]"></i> مؤشر نمو البيانات التاريخي
            </h4>
            <div className="h-[280px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={[{n:'يناير',v:10},{n:'فبراير',v:25},{n:'مارس',v:15},{n:'أبريل',v:45},{n:'مايو',v:35},{n:'يونيو',v:60}]}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                   <XAxis dataKey="n" stroke="#475569" fontSize={10} fontBold={true} tickLine={false} />
                   <YAxis hide />
                   <Tooltip contentStyle={{backgroundColor:'#0f172a', border:'1px solid rgba(255,255,255,0.05)', borderRadius:'12px'}} />
                   <Area type="monotone" dataKey="v" stroke="#38bdf8" strokeWidth={3} fill="url(#colorV)" />
                   <defs>
                     <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                 </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-8 rounded-[3rem] border border-white/5 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
            <div className="relative z-10">
               <h4 className="text-white font-black text-xl mb-4">مركز الدعم الذكي</h4>
               <p className="text-slate-400 text-sm leading-relaxed">يمكنك طلب مساعدة الذكاء الاصطناعي في تحليل بيانات مكتبك أو توليد تقارير توقعية بنقرة واحدة.</p>
            </div>
            <button className="relative z-10 mt-8 py-4 bg-white/5 hover:bg-[#38bdf8] hover:text-[#0f172a] text-white border border-white/10 rounded-2xl font-black transition-all flex items-center justify-center gap-3">
               <i className="fas fa-robot text-xl"></i> تشغيل المساعد الذكي
            </button>
            <i className="fas fa-microchip absolute bottom-[-40px] left-[-40px] text-[12rem] text-white/5 -rotate-12 group-hover:rotate-0 transition-transform duration-1000"></i>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
