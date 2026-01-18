
import React, { useState, useEffect, useMemo } from 'react';
import { User, Martyr, Amputee, Beneficiary, Office, RecordStatus, UserRole } from '../types';
import { apiService } from '../services/apiService';

interface ReportsProps {
  currentUser: User;
}

const Reports: React.FC<ReportsProps> = ({ currentUser }) => {
  const [viewType, setViewType] = useState<'summary' | 'detailed'>('summary');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  const [rawData, setRawData] = useState<{
    martyrs: Martyr[];
    amputees: Amputee[];
    beneficiaries: Beneficiary[];
    offices: Office[];
    currentOfficeInfo: Office | null;
  }>({ martyrs: [], amputees: [], beneficiaries: [], offices: [], currentOfficeInfo: null });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReportData = async () => {
      setLoading(true);
      try {
        const [martyrs, amputees, beneficiaries, offices] = await Promise.all([
          apiService.getMartyrs(),
          apiService.getAmputees(),
          apiService.getBeneficiaries(),
          apiService.getOffices()
        ]);
        
        const officeInfo = offices.find((o: Office) => o.id === currentUser.officeId || o.name === currentUser.officeName);

        const filterByOffice = (list: any[]) => {
          if (currentUser.role === UserRole.ADMIN || currentUser.accessScope === 'all_offices') return list;
          return list.filter(item => item.office === currentUser.officeName || item.officeId === currentUser.officeId);
        };

        const filteredMartyrs = filterByOffice(martyrs);
        const filteredAmputees = filterByOffice(amputees);

        const filteredBeneficiaries = beneficiaries.filter(b => {
           if (currentUser.role === UserRole.ADMIN || currentUser.accessScope === 'all_offices') return true;
           return filteredMartyrs.some(m => m.fullName === b.martyrName);
        });

        setRawData({
          martyrs: filteredMartyrs,
          amputees: filteredAmputees,
          offices: offices,
          currentOfficeInfo: officeInfo || null,
          beneficiaries: filteredBeneficiaries
        });
      } catch (err) {
        console.error("Error loading report data", err);
      } finally {
        setLoading(false);
      }
    };
    loadReportData();
  }, [currentUser]);

  // منطق الفلترة الزمنية الذكي
  const filteredData = useMemo(() => {
    const isWithinRange = (dateStr: string) => {
      if (!dateStr) return true;
      const date = new Date(dateStr);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      if (start && date < start) return false;
      if (end && date > end) return false;
      return true;
    };

    return {
      martyrs: rawData.martyrs.filter(m => isWithinRange(m.dateOfMartyrdom)),
      amputees: rawData.amputees.filter(a => isWithinRange(a.lastPaymentDate)),
      beneficiaries: rawData.beneficiaries,
      currentOfficeInfo: rawData.currentOfficeInfo,
      allOffices: rawData.offices
    };
  }, [rawData, startDate, endDate]);

  const stats = useMemo(() => {
    const statusCounts = filteredData.martyrs.reduce((acc: any, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1;
      return acc;
    }, {});

    const amputeeStatusCounts = filteredData.amputees.reduce((acc: any, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1;
      return acc;
    }, {});

    // إحصائيات المكاتب (للمسؤولين فقط)
    const officeStats = filteredData.allOffices.map(office => {
        const mCount = rawData.martyrs.filter(m => m.office === office.name).length;
        const aCount = rawData.amputees.filter(a => a.office === office.name).length;
        return { ...office, mCount, aCount };
    });

    return { statusCounts, amputeeStatusCounts, officeStats };
  }, [filteredData, rawData]);

  const exportToExcel = () => {
    let rows: string[][] = [];
    if (viewType === 'summary') {
      rows = [
        ["الاسم الكامل", "الفئة", "الرقم الوطني", "الحالة", "المكتب"],
        ...filteredData.martyrs.map(m => [m.fullName, "شهيد", m.nationalId, m.status, m.office]),
        ...filteredData.amputees.map(a => [a.fullName, "مبتور", a.nationalId, a.status, a.office])
      ];
    } else {
      rows = [
        ["نوع السجل", "الاسم الكامل", "الرقم الوطني", "صلة القرابة", "يتبع للشهيد", "الحالة", "المنحة"],
        ...filteredData.martyrs.flatMap(m => {
          const martyrRow = ["شهيد", m.fullName, m.nationalId, "-", "-", m.status, m.lastGrantAmount.toString()];
          const mBeneficiaries = filteredData.beneficiaries.filter(b => b.martyrName === m.fullName);
          const bRows = mBeneficiaries.map(b => ["مستفيد", b.fullName, b.nationalId, b.relationship, m.fullName, b.status, b.lastGrantAmount.toString()]);
          return [martyrRow, ...bRows];
        })
      ];
    }
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `تقرير_${currentUser.officeName}_${new Date().toLocaleDateString()}.csv`);
    link.click();
  };

  const getStatusStyle = (status: RecordStatus) => {
    switch (status) {
      case 'مستوفي': return 'text-emerald-600';
      case 'تحت الإجراء': return 'text-blue-600';
      case 'موقوف': return 'text-amber-600';
      default: return 'text-red-600';
    }
  };

  const getOfficeIcon = (index: number) => {
    const icons = ['fa-city', 'fa-landmark', 'fa-building-columns', 'fa-building-flag', 'fa-mosque', 'fa-house-chimney-window'];
    return icons[index % icons.length];
  };

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fadeIn text-right relative font-['Tajawal']" dir="rtl">
      {/* قسم الفلترة المطور */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl print:hidden space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-gray-800">مركز التقارير السيادية</h2>
            <p className="text-gray-500 text-sm font-bold">توليد مستندات معتمدة بناءً على بيانات {currentUser.officeName}</p>
          </div>
          
          <div className="flex gap-3">
             <button onClick={exportToExcel} className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center shadow-sm">
                <i className="fas fa-file-excel text-lg"></i>
             </button>
             <button onClick={() => window.print()} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 shadow-lg flex items-center gap-3">
                <i className="fas fa-print"></i> طباعة معتمدة
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 border-t border-gray-100">
           <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">نطاق البداية</label>
              <div className="relative">
                <i className="fas fa-calendar-alt absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none"></i>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">نطاق النهاية</label>
              <div className="relative">
                <i className="fas fa-calendar-check absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none"></i>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
           </div>
           <div className="flex items-end">
              <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full">
                <button 
                  onClick={() => setViewType('summary')} 
                  className={`flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black transition-all ${viewType === 'summary' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  ملخص إحصائي
                </button>
                <button 
                  onClick={() => setViewType('detailed')} 
                  className={`flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black transition-all ${viewType === 'detailed' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  تقرير تفصيلي
                </button>
              </div>
           </div>
           <div className="flex items-end">
              <button 
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl text-[10px] font-black transition-all"
              >
                إعادة ضبط الوقت
              </button>
           </div>
        </div>
      </div>

      {/* منطقة الطباعة والمحتوى */}
      <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-2xl print:shadow-none print:border-none print:p-0">
        <div className="flex justify-between items-center border-b-4 border-emerald-600 pb-10 mb-12">
           <div className="text-right space-y-1">
              <p className="font-black text-2xl text-gray-900 tracking-tighter">منظومة رعاية الشهداء والمبتورين</p>
              <p className="text-lg text-emerald-600 font-black">{currentUser.officeName}</p>
           </div>
           <div className="w-28 h-28 bg-emerald-50 rounded-3xl flex items-center justify-center border-4 border-emerald-100 shadow-inner">
              <i className="fas fa-shield-halved text-emerald-600 text-5xl"></i>
           </div>
           <div className="text-left font-black text-[10px] text-gray-400 space-y-1 uppercase tracking-widest">
              <p>تاريخ الاستخراج: {new Date().toLocaleDateString('ar-LY')}</p>
              <p>رقم الكشف: {Math.floor(Date.now() / 100000)}/SEC</p>
           </div>
        </div>

        <div className="text-center mb-16">
           <h2 className="text-4xl font-black text-gray-800 mb-6 underline decoration-emerald-500/30 decoration-8 underline-offset-8">
              {viewType === 'summary' ? 'بيان الموقف الإحصائي العام' : 'الكشف العام التفصيلي الموحد'}
           </h2>
           <div className="flex justify-center items-center gap-4 text-emerald-600 font-black text-sm bg-emerald-50/50 py-3 px-8 rounded-full w-max mx-auto border border-emerald-100">
              <i className="fas fa-history"></i>
              نطاق التقرير: 
              <span>{startDate || 'البداية'}</span>
              <i className="fas fa-long-arrow-alt-left mx-2"></i>
              <span>{endDate || 'الآن'}</span>
           </div>
        </div>

        {viewType === 'summary' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="bg-emerald-50/50 p-8 rounded-[2.5rem] border border-emerald-100 text-center shadow-sm relative overflow-hidden group">
                 <i className="fas fa-user-check absolute bottom-[-10px] left-[-10px] text-5xl text-emerald-600/10 -rotate-12 transition-transform group-hover:rotate-0"></i>
                 <p className="text-emerald-800 text-[10px] font-black uppercase mb-2 tracking-widest">الشهداء المسجلين</p>
                 <h4 className="text-4xl font-black text-emerald-900">{filteredData.martyrs.length}</h4>
              </div>
              <div className="bg-blue-50/50 p-8 rounded-[2.5rem] border border-blue-100 text-center shadow-sm relative overflow-hidden group">
                 <i className="fas fa-users-rectangle absolute bottom-[-10px] left-[-10px] text-5xl text-blue-600/10 -rotate-12 transition-transform group-hover:rotate-0"></i>
                 <p className="text-blue-800 text-[10px] font-black uppercase mb-2 tracking-widest">المستفيدين المعتمدين</p>
                 <h4 className="text-4xl font-black text-blue-900">{filteredData.beneficiaries.length}</h4>
              </div>
              <div className="bg-amber-50/50 p-8 rounded-[2.5rem] border border-amber-100 text-center shadow-sm relative overflow-hidden group">
                 <i className="fas fa-user-injured absolute bottom-[-10px] left-[-10px] text-5xl text-amber-600/10 -rotate-12 transition-transform group-hover:rotate-0"></i>
                 <p className="text-amber-800 text-[10px] font-black uppercase mb-2 tracking-widest">المبتورين المسجلين</p>
                 <h4 className="text-4xl font-black text-amber-900">{filteredData.amputees.length}</h4>
              </div>
            </div>

            {/* قسم تقارير المكاتب السريعة (للمسؤولين) */}
            {(currentUser.role === UserRole.ADMIN || currentUser.accessScope === 'all_offices') && (
              <div className="mb-16 print:hidden">
                <h3 className="font-black text-xl text-gray-800 mb-8 flex items-center gap-3">
                  <span className="w-2 h-8 bg-slate-800 rounded-full"></span> تقارير المكاتب الإقليمية
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {stats.officeStats.map((office, idx) => (
                    <div key={office.id} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all border-b-4 border-b-emerald-500/20 text-center">
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600 border border-emerald-50">
                        <i className={`fas ${getOfficeIcon(idx)} text-xl`}></i>
                      </div>
                      <p className="font-black text-gray-800 text-xs truncate mb-2">{office.name}</p>
                      <div className="flex justify-center gap-3">
                         <div className="text-[10px] font-bold text-gray-400">
                            <span className="text-emerald-600 block font-black">{office.mCount}</span> شهيد
                         </div>
                         <div className="w-px h-6 bg-gray-100"></div>
                         <div className="text-[10px] font-bold text-gray-400">
                            <span className="text-amber-600 block font-black">{office.aCount}</span> مبتور
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
               <div className="bg-gray-50/50 p-10 rounded-[2.5rem] border border-gray-100">
                  <h3 className="font-black text-xl text-gray-800 mb-8 flex items-center gap-3">
                     <span className="w-2 h-8 bg-emerald-500 rounded-full"></span> توزيع حالات الشهداء
                  </h3>
                  <div className="space-y-6">
                    {['مستوفي', 'تحت الإجراء', 'موقوف'].map(status => (
                      <div key={status} className="flex justify-between items-center pb-4 border-b border-gray-200 last:border-0">
                        <span className="font-black text-gray-600 text-lg">{status}</span>
                        <span className={`text-2xl font-black ${getStatusStyle(status as RecordStatus)}`}>{stats.statusCounts[status] || 0}</span>
                      </div>
                    ))}
                  </div>
               </div>
               <div className="bg-gray-50/50 p-10 rounded-[2.5rem] border border-gray-100">
                  <h3 className="font-black text-xl text-gray-800 mb-8 flex items-center gap-3">
                     <span className="w-2 h-8 bg-amber-500 rounded-full"></span> توزيع حالات المبتورين
                  </h3>
                  <div className="space-y-6">
                    {['مستوفي', 'تحت الإجراء', 'موقوف'].map(status => (
                      <div key={status} className="flex justify-between items-center pb-4 border-b border-gray-200 last:border-0">
                        <span className="font-black text-gray-600 text-lg">{status}</span>
                        <span className={`text-2xl font-black ${getStatusStyle(status as RecordStatus)}`}>{stats.amputeeStatusCounts[status] || 0}</span>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </>
        ) : (
          <div className="mb-20 overflow-hidden rounded-[2.5rem] border border-gray-100 shadow-sm">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-emerald-600 text-white font-black uppercase tracking-widest">
                  <th className="px-6 py-6">الاسم الكامل</th>
                  <th className="px-6 py-6">الرقم الوطني</th>
                  <th className="px-6 py-6 text-center">الفئة / الصفة</th>
                  <th className="px-6 py-6 text-center">المستحقات</th>
                  <th className="px-6 py-6 text-center">الحالة الرسمية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.martyrs.map((martyr) => (
                  <tr key={martyr.id} className="bg-emerald-50/30">
                    <td className="px-6 py-6 font-black text-emerald-900 text-sm">{martyr.fullName}</td>
                    <td className="px-6 py-6 font-mono font-bold text-gray-500">{martyr.nationalId}</td>
                    <td className="px-6 py-6 text-center font-bold">شهيد</td>
                    <td className="px-6 py-6 text-center font-black">{martyr.lastGrantAmount?.toLocaleString()}</td>
                    <td className={`px-6 py-6 text-center font-black ${getStatusStyle(martyr.status)}`}>{martyr.status}</td>
                  </tr>
                ))}
                {filteredData.amputees.map((amputee) => (
                  <tr key={amputee.id} className="bg-amber-50/20">
                    <td className="px-6 py-6 font-black text-amber-900 text-sm">{amputee.fullName}</td>
                    <td className="px-6 py-6 font-mono font-bold text-gray-500">{amputee.nationalId}</td>
                    <td className="px-6 py-6 text-center font-bold">مبتور</td>
                    <td className="px-6 py-6 text-center font-black">{amputee.lastGrantAmount?.toLocaleString()}</td>
                    <td className={`px-6 py-6 text-center font-black ${getStatusStyle(amputee.status)}`}>{amputee.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-24 pt-12 border-t border-gray-100 flex justify-between items-start">
           <div className="text-center w-64">
              <p className="font-black text-gray-800 mb-10">المراجعة والتدقيق</p>
              <div className="w-48 h-px bg-gray-200 mx-auto"></div>
           </div>
           <div className="text-center w-64 space-y-6">
              <p className="font-black text-gray-900">يُعتمد، مدير المكتب</p>
              <div className="w-40 h-40 border-4 border-double border-emerald-600/20 rounded-full mx-auto flex items-center justify-center opacity-40">
                 <p className="text-[10px] font-black text-emerald-700 leading-none">SEAL OF OFFICE<br/>{currentUser.officeName}</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
