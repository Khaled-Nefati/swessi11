
import React, { useState, useMemo, useEffect } from 'react';
import { Martyr, RecordStatus, User, Beneficiary } from '../types';
import { apiService } from '../services/apiService';

const MartyrsInquiry: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [martyrs, setMartyrs] = useState<Martyr[]>([]);
  const [allBeneficiaries, setAllBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBeneficiariesModalOpen, setIsBeneficiariesModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Martyr> | null>(null);
  const [selectedMartyr, setSelectedMartyr] = useState<Martyr | null>(null);
  const [notifications, setNotifications] = useState<{id: number, msg: string, type: string}[]>([]);
  const [printData, setPrintData] = useState<Martyr | null>(null);
  
  const [sortConfig, setSortConfig] = useState<{ key: keyof Martyr; direction: 'asc' | 'desc' } | null>({
    key: 'fullName',
    direction: 'asc'
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('app_session');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [martyrsData, beneficiariesData] = await Promise.all([
        apiService.getMartyrs(),
        apiService.getBeneficiaries()
      ]);
      setMartyrs(martyrsData);
      setAllBeneficiaries(beneficiariesData);
    } catch (err) {
      addNotify('خطأ في جلب بيانات الشهداء', 'error');
    } finally { setLoading(false); }
  };

  const addNotify = (msg: string, type: string = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  };

  const requestSort = (key: keyof Martyr) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handlePrintMartyr = (martyr: Martyr) => {
    setPrintData(martyr);
    setTimeout(() => {
      window.print();
      setPrintData(null);
    }, 500);
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...martyrs];
    if (currentUser?.accessScope === 'office_only') {
      result = result.filter(m => m.office === currentUser.officeName);
    }
    result = result.filter(m => 
      m.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.nationalId?.includes(searchTerm)
    );
    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [martyrs, searchTerm, currentUser, sortConfig]);

  const canEdit = currentUser?.permissions.martyrs.edit;
  const canDelete = currentUser?.permissions.martyrs.delete;

  const handleDelete = async (id: string) => {
    if (!canDelete) return addNotify('ليس لديك صلاحية الحذف', 'error');
    if (window.confirm('هل أنت متأكد من حذف هذا السجل نهائياً؟')) {
      try {
        await apiService.deleteMartyr(id);
        setMartyrs(prev => prev.filter(m => m.id !== id));
        addNotify('تم حذف السجل بنجاح');
      } catch (err) { addNotify('فشل في حذف السجل', 'error'); }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return addNotify('ليس لديك صلاحية التعديل', 'error');
    if (!editingItem) return;
    try {
      if (editingItem.id) {
        await apiService.updateMartyr(editingItem.id, editingItem);
        setMartyrs(prev => prev.map(m => m.id === editingItem.id ? { ...m, ...editingItem } : m));
        addNotify('تم تحديث البيانات بنجاح');
      } else {
        const newItem = await apiService.createMartyr({ 
          ...editingItem, 
          id: Date.now().toString(),
          office: currentUser?.officeName || 'غير محدد',
          barcode: `MTR-${Math.floor(10000 + Math.random() * 90000)}`
        });
        setMartyrs(prev => [newItem, ...prev]);
        addNotify('تم إضافة السجل بنجاح');
      }
      setIsModalOpen(false);
    } catch (err) { addNotify('خطأ في حفظ البيانات', 'error'); }
  };

  const handleViewBeneficiaries = (martyr: Martyr) => {
    setSelectedMartyr(martyr);
    setIsBeneficiariesModalOpen(true);
  };

  const associatedBeneficiaries = useMemo(() => {
    if (!selectedMartyr) return [];
    return allBeneficiaries.filter(b => b.martyrName === selectedMartyr.fullName);
  }, [selectedMartyr, allBeneficiaries]);

  const getSortIcon = (key: keyof Martyr) => {
    if (sortConfig?.key !== key) return <i className="fas fa-sort ml-2 opacity-30 text-[10px]"></i>;
    return sortConfig.direction === 'asc' 
      ? <i className="fas fa-sort-up ml-2 text-[#38bdf8]"></i> 
      : <i className="fas fa-sort-down ml-2 text-[#38bdf8]"></i>;
  };

  return (
    <div className="space-y-6 animate-fadeIn relative font-['Tajawal'] text-right">
      {/* قسم الطباعة المخفي */}
      {printData && (
        <div className="fixed inset-0 bg-white z-[9999] hidden print:block p-12 text-black" dir="rtl">
          <div className="border-[15px] border-double border-[#38bdf8] p-10 h-full relative flex flex-col items-center">
            <div className="w-full flex justify-between items-start border-b-4 border-[#0f172a] pb-8 mb-10">
              <div className="text-center w-64">
                <p className="text-xl font-black text-[#0f172a]">منظومة رعاية الشهداء</p>
                <p className="text-sm font-bold mt-1 text-slate-600">إدارة المكاتب الإقليمية</p>
              </div>
              <div className="w-24 h-24 bg-[#0f172a] rounded-2xl flex items-center justify-center border-4 border-[#38bdf8]">
                <i className="fas fa-shield-halved text-[#38bdf8] text-4xl"></i>
              </div>
              <div className="text-left w-64">
                <p className="text-[10px] font-bold">التسلسل: {printData.barcode || '---'}</p>
                <p className="text-[10px] font-bold">المكتب: {printData.office}</p>
              </div>
            </div>
            <div className="text-center mb-10">
              <h2 className="text-5xl font-black mb-4">شهادة استشهاد رسمية</h2>
              <div className="w-32 h-1 bg-[#38bdf8] mx-auto"></div>
            </div>
            <div className="px-10 text-3xl leading-[2.8] text-center max-w-4xl font-medium">
              تفيد الإدارة العامة لرعاية أسر الشهداء والمفقودين بأن المغفور له بإذن الله تعالى: 
              <br/>
              <span className="font-black text-4xl underline decoration-[#38bdf8] decoration-4 underline-offset-8 leading-[1.5] block my-4">{printData.fullName}</span>
              صاحب الرقم الوطني (<span className="font-mono font-black">{printData.nationalId}</span>)، 
              قد سُجل في سجلات الشرف كشهيد واجب بتاريخ 
              <span className="font-black text-[#0f172a]"> {printData.dateOfMartyrdom} </span> 
              بمكتب <span className="font-bold">({printData.office})</span>.
            </div>
            <div className="mt-auto w-full flex justify-between items-end px-10">
               <div className="text-center font-bold text-sm bg-slate-50 px-6 py-3 rounded-xl border border-slate-200">
                  تاريخ الإصدار: {new Date().toLocaleDateString('ar-LY')}
               </div>
               <div className="text-center space-y-4">
                  <p className="font-black text-xl">توقيع وختم مدير المكتب</p>
                  <div className="w-32 h-32 border-4 border-double border-[#38bdf8]/30 rounded-full mx-auto flex items-center justify-center opacity-40">
                    <span className="text-[10px] font-black text-[#0f172a] rotate-12">OFFICIAL SEAL</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      <div className="fixed top-24 left-6 z-[200] space-y-3 print:hidden">
        {notifications.map(n => (
          <div key={n.id} className={`bg-[#0f172a] border-r-4 ${n.type === 'error' ? 'border-red-500' : 'border-[#38bdf8]'} shadow-2xl p-4 rounded-xl flex items-center gap-3 text-white border border-white/5`}>
            <i className={`fas ${n.type === 'error' ? 'fa-circle-xmark text-red-500' : 'fa-check-circle text-[#38bdf8]'}`}></i>
            <span className="font-bold text-sm">{n.msg}</span>
          </div>
        ))}
      </div>

      <div className="bg-[#1e293b]/60 backdrop-blur-md p-8 rounded-3xl border border-white/5 flex flex-col lg:flex-row gap-6 items-center shadow-xl print:hidden">
        <div className="relative flex-1 w-full">
          <i className="fas fa-magnifying-glass absolute right-5 top-1/2 -translate-y-1/2 text-[#38bdf8]"></i>
          <input 
            type="text" 
            placeholder="البحث بالاسم أو الرقم الوطني..."
            className="w-full pr-14 pl-6 py-4 bg-black/20 border border-white/5 rounded-2xl outline-none focus:ring-4 focus:ring-[#38bdf8]/10 text-white font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {canEdit && (
          <button 
            onClick={() => { setEditingItem({ status: 'مستوفي', lastGrantAmount: 0, dateOfMartyrdom: new Date().toISOString().split('T')[0] }); setIsModalOpen(true); }}
            className="px-10 py-4 bg-[#38bdf8] text-[#0f172a] rounded-2xl font-black hover:brightness-110 transition-all flex items-center gap-2"
          >
            <i className="fas fa-plus"></i> إضافة جديد
          </button>
        )}
      </div>

      <div className="bg-[#1e293b]/30 backdrop-blur-sm rounded-3xl shadow-xl border border-white/5 overflow-hidden print:hidden">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-[#0f172a] text-[#38bdf8] text-[10px] font-black uppercase tracking-widest border-b border-white/5">
              <th className="px-8 py-6 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => requestSort('fullName')}>
                {getSortIcon('fullName')} الاسم الكامل 
              </th>
              <th className="px-8 py-6 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => requestSort('dateOfMartyrdom')}>
                {getSortIcon('dateOfMartyrdom')} تاريخ الاستشهاد
              </th>
              <th className="px-8 py-6">الرقم الوطني</th>
              <th className="px-8 py-6">المكتب</th>
              <th className="px-8 py-6 text-center">الحالة</th>
              <th className="px-8 py-6 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {filteredAndSorted.map((martyr) => (
              <tr key={martyr.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-8 py-6 font-black text-white">{martyr.fullName}</td>
                <td className="px-8 py-6">
                  <span className="bg-white/5 px-3 py-1 rounded-lg text-[#38bdf8] font-mono text-xs border border-white/5">
                    {martyr.dateOfMartyrdom}
                  </span>
                </td>
                <td className="px-8 py-6 font-mono text-slate-400 font-bold">{martyr.nationalId}</td>
                <td className="px-8 py-6 text-slate-300 font-bold text-xs">{martyr.office}</td>
                <td className="px-8 py-6 text-center">
                   <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black border ${martyr.status === 'مستوفي' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' : 'text-amber-400 border-amber-500/20 bg-amber-500/5'}`}>
                    {martyr.status}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex gap-2 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handlePrintMartyr(martyr)} 
                      className="p-2 text-[#38bdf8] hover:bg-[#38bdf8]/10 rounded-lg transition-colors"
                      title="طباعة إفادة استشهاد"
                    >
                      <i className="fas fa-print"></i>
                    </button>
                    <button 
                      onClick={() => handleViewBeneficiaries(martyr)} 
                      className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                      title="عرض المستفيدين"
                    >
                      <i className="fas fa-users"></i>
                    </button>
                    {canEdit && <button onClick={() => { setEditingItem(martyr); setIsModalOpen(true); }} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"><i className="fas fa-edit"></i></button>}
                    {canDelete && <button onClick={() => handleDelete(martyr.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><i className="fas fa-trash"></i></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* نافذة عرض المستفيدين */}
      {isBeneficiariesModalOpen && selectedMartyr && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 backdrop-blur-xl bg-black/70 print:hidden">
          <div className="bg-[#0f172a] border border-[#38bdf8]/30 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-scaleIn">
            <div className="p-8 border-b border-white/5 bg-[#1e293b]/50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-white">المستفيدون المرتبطون</h3>
                <p className="text-[#38bdf8] text-xs font-bold mt-1">الشهيد: {selectedMartyr.fullName}</p>
              </div>
              <button onClick={() => setIsBeneficiariesModalOpen(false)} className="w-10 h-10 bg-white/5 text-slate-400 hover:text-white rounded-xl flex items-center justify-center transition-all">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-8">
              {associatedBeneficiaries.length > 0 ? (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {associatedBeneficiaries.map((bnf) => (
                    <div key={bnf.id} className="bg-white/5 border border-white/5 p-5 rounded-2xl flex justify-between items-center hover:bg-white/10 transition-all">
                      <div>
                        <p className="font-black text-white">{bnf.fullName}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-1">الرقم الوطني: {bnf.nationalId}</p>
                      </div>
                      <div className="text-left">
                        <span className="bg-[#38bdf8]/10 text-[#38bdf8] px-3 py-1 rounded-lg text-[10px] font-black border border-[#38bdf8]/20">
                          {bnf.relationship}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-slate-500">
                  <i className="fas fa-user-slash text-4xl mb-4 opacity-20 block"></i>
                  <p className="font-bold">لا يوجد مستفيدون مسجلون لهذا الشهيد حالياً</p>
                </div>
              )}
            </div>
            <div className="p-8 bg-[#1e293b]/20 border-t border-white/5">
              <button 
                onClick={() => setIsBeneficiariesModalOpen(false)} 
                className="w-full py-4 bg-white/5 text-white rounded-xl font-black hover:bg-white/10 transition-all"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 backdrop-blur-sm bg-black/60 print:hidden">
          <div className="bg-[#0f172a] border border-[#38bdf8]/30 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-scaleIn">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#1e293b]/50">
              <h3 className="text-xl font-black text-white">{editingItem?.id ? 'تعديل السجل' : 'إضافة سجل جديد'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSave} className="p-10 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase">الاسم الكامل</label>
                  <input required value={editingItem?.fullName || ''} onChange={e => setEditingItem({...editingItem!, fullName: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-[#38bdf8]" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase">الرقم الوطني</label>
                  <input required value={editingItem?.nationalId || ''} onChange={e => setEditingItem({...editingItem!, nationalId: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-[#38bdf8]" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase">تاريخ الاستشهاد</label>
                  <input type="date" required value={editingItem?.dateOfMartyrdom || ''} onChange={e => setEditingItem({...editingItem!, dateOfMartyrdom: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-[#38bdf8]" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase">الحالة</label>
                  <select value={editingItem?.status || 'مستوفي'} onChange={e => setEditingItem({...editingItem!, status: e.target.value as RecordStatus})} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white outline-none">
                    <option value="مستوفي">مستوفي</option>
                    <option value="تحت الإجراء">تحت الإجراء</option>
                    <option value="موقوف">موقوف</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <button type="submit" className="flex-1 py-4 bg-[#38bdf8] text-[#0f172a] rounded-xl font-black shadow-lg hover:brightness-110 transition-all">حفظ البيانات</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-white/5 text-slate-400 rounded-xl font-black transition-all">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MartyrsInquiry;
