
import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Beneficiary, RecordStatus, User } from '../types';
import { apiService } from '../services/apiService';

const BeneficiariesInquiry: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [nationalIdSearch, setNationalIdSearch] = useState('');
  const [relationshipFilter, setRelationshipFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Beneficiary> | null>(null);
  const [notifications, setNotifications] = useState<{id: number, msg: string, type: string}[]>([]);
  const [printData, setPrintData] = useState<Beneficiary | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('app_session');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await apiService.getBeneficiaries();
      setBeneficiaries(data.map((b: any) => ({ ...b, barcode: b.barcode || `BNF-${b.id.toString().padStart(5, '0')}` })));
    } catch (err) {
      addNotify('خطأ في جلب بيانات المستفيدين', 'error');
    } finally { setLoading(false); }
  };

  const addNotify = (msg: string, type: string = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  };

  const handlePrintCertificate = (bnf: Beneficiary) => {
    setPrintData(bnf);
    setTimeout(() => {
      window.print();
      setPrintData(null);
    }, 500);
  };

  const filtered = useMemo(() => {
    let result = beneficiaries;
    return result.filter(b => {
      const searchLower = searchTerm.toLowerCase();
      // البحث العام (الاسم أو اسم الشهيد)
      const matchGeneral = !searchTerm || 
                           b.fullName.toLowerCase().includes(searchLower) || 
                           b.martyrName?.toLowerCase().includes(searchLower);
      
      // البحث المخصص بالرقم الوطني
      const matchNationalId = !nationalIdSearch || b.nationalId.includes(nationalIdSearch);
      
      const matchRel = relationshipFilter === 'all' || b.relationship === relationshipFilter;
      const matchStatus = statusFilter === 'all' || b.status === statusFilter;
      
      return matchGeneral && matchNationalId && matchRel && matchStatus;
    });
  }, [beneficiaries, searchTerm, nationalIdSearch, relationshipFilter, statusFilter, currentUser]);

  const canEdit = currentUser?.permissions.beneficiaries.edit;
  const canDelete = currentUser?.permissions.beneficiaries.delete;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !canEdit) return;
    try {
      if (editingItem.id) {
        await apiService.updateBeneficiary(editingItem.id, editingItem);
        setBeneficiaries(prev => prev.map(b => b.id === editingItem.id ? { ...b, ...editingItem as Beneficiary } : b));
        addNotify('تم تحديث بيانات المستفيد');
      } else {
        const newItem = await apiService.createBeneficiary({ 
          ...editingItem, 
          id: Date.now().toString(),
          barcode: `BNF-${Math.floor(10000 + Math.random() * 90000)}`
        });
        setBeneficiaries(prev => [newItem, ...prev]);
        addNotify('تم إضافة المستفيد بنجاح');
      }
      setIsModalOpen(false);
    } catch (err) { addNotify('خطأ في حفظ البيانات', 'error'); }
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) return;
    if (window.confirm('هل أنت متأكد من حذف هذا المستفيد؟')) {
      try {
        await apiService.deleteBeneficiary(id);
        setBeneficiaries(prev => prev.filter(b => b.id !== id));
        addNotify('تم الحذف بنجاح');
      } catch (err) { addNotify('خطأ في الحذف', 'error'); }
    }
  };

  const getStatusStyle = (status: RecordStatus) => {
    switch (status) {
      case 'مستوفي': return 'bg-emerald-900/40 text-emerald-400 border-emerald-500/30';
      case 'غير مستوفي': return 'bg-red-900/40 text-red-400 border-red-500/30';
      case 'موقوف': return 'bg-amber-900/40 text-amber-400 border-amber-500/30';
      case 'تحت الإجراء': return 'bg-blue-900/40 text-blue-400 border-blue-500/30';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn relative font-['Tajawal'] text-right">
      {/* واجهة الطباعة (تظهر فقط عند الطباعة) */}
      {printData && (
        <div className="fixed inset-0 bg-white z-[9999] hidden print:block p-12 text-black" dir="rtl">
          <div className="border-[15px] border-double border-[#DAA520] p-10 h-full relative flex flex-col items-center">
            <div className="w-full flex justify-between items-start border-b-4 border-[#001c38] pb-8 mb-10">
              <div className="text-center w-64">
                <p className="text-xl font-black text-[#001c38]">منظومة رعاية الأسر</p>
                <p className="text-xs font-bold text-slate-500 uppercase mt-1">Sovereign Care System</p>
              </div>
              <div className="w-24 h-24 bg-[#001c38] rounded-2xl flex items-center justify-center border-4 border-[#DAA520]">
                <i className="fas fa-users text-[#DAA520] text-4xl"></i>
              </div>
              <div className="text-left w-64">
                <p className="text-[10px] font-bold">الرمز التسلسلي: {printData.barcode}</p>
                <p className="text-[10px] font-bold">الحالة: {printData.status}</p>
              </div>
            </div>
            <div className="text-center mb-10">
              <h2 className="text-5xl font-black mb-4">إفادة مستفيد ملكية</h2>
              <div className="w-32 h-1 bg-[#DAA520] mx-auto"></div>
            </div>
            <div className="px-10 text-3xl leading-[2.5] text-center max-w-4xl font-medium">
              تشهد الإدارة المختصة بأن السيد/ة: 
              <br/>
              <span className="font-black text-4xl underline decoration-[#DAA520] decoration-4 underline-offset-8 block my-4">{printData.fullName}</span>
              صاحب الرقم الوطني (<span className="font-mono font-black">{printData.nationalId}</span>)، 
              هو مستفيد بصفة <span className="font-black text-[#001c38]">({printData.relationship})</span> 
              للمغفور له الشهيد: <span className="font-black"> {printData.martyrName}</span>.
            </div>
            <div className="mt-auto w-full flex justify-between items-end px-10">
               <div className="text-center font-bold text-sm bg-slate-50 px-6 py-3 rounded-xl border border-slate-200">
                  تاريخ الاستخراج: {new Date().toLocaleDateString('ar-LY')}
               </div>
               <div className="text-center">
                  <p className="font-black text-xl mb-10">توقيع المسؤول والختم</p>
                  <div className="w-32 h-32 border-4 border-dashed border-gray-300 rounded-full flex items-center justify-center opacity-30">
                    <span className="text-[10px] font-black text-slate-400 rotate-12 uppercase tracking-widest">Seal of Office</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      <div className="fixed top-24 left-6 z-[500] space-y-3 print:hidden">
        {notifications.map(n => (
          <div key={n.id} className={`bg-[#0f172a] border-r-4 ${n.type === 'error' ? 'border-red-500' : 'border-[#DAA520]'} shadow-2xl p-4 rounded-xl flex items-center gap-3 text-white border border-white/5`}>
            <i className={`fas ${n.type === 'error' ? 'fa-circle-xmark text-red-500' : 'fa-check-circle text-[#DAA520]'}`}></i>
            <span className="font-bold text-sm">{n.msg}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 print:hidden">
        <div className="bg-[#001c38]/60 backdrop-blur-md p-8 rounded-[3rem] border border-[#DAA520]/10 flex items-center gap-6 group hover:border-[#DAA520]/40 transition-all shadow-xl">
           <div className="w-16 h-16 bg-black/40 text-[#DAA520] rounded-2xl flex items-center justify-center text-3xl shadow-xl border border-[#DAA520]/20 group-hover:scale-110 transition-transform">
              <i className="fas fa-wallet"></i>
           </div>
           <div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">إجمالي المخصصات</p>
              <h4 className="text-2xl font-black text-white">{filtered.reduce((acc, curr) => acc + (curr.lastGrantAmount || 0), 0).toLocaleString()} د.ل</h4>
           </div>
        </div>
        <div className="md:col-span-2 bg-gradient-to-br from-[#001c38] to-[#000b14] p-8 rounded-[3rem] text-white shadow-2xl flex items-center justify-between overflow-hidden relative group border border-[#DAA520]/30 border-r-8 border-r-[#DAA520]">
           <div className="relative z-10">
              <p className="text-[#DAA520] text-[10px] font-black uppercase tracking-widest mb-1">الوصول: {currentUser?.role}</p>
              <h4 className="text-xl font-black">إدارة المستفيدين والمنح المالية</h4>
           </div>
           {canEdit && (
             <button onClick={() => { setEditingItem({ status: 'مستوفي', lastGrantAmount: 0 }); setIsModalOpen(true); }} className="relative z-20 px-8 py-3 bg-[#DAA520] text-[#000b14] rounded-xl font-black shadow-lg hover:brightness-110 transition-all">
               <i className="fas fa-plus ml-2"></i> إضافة مستفيد
             </button>
           )}
           <i className="fas fa-crown absolute bottom-[-30px] left-[-30px] text-[10rem] text-white/5 -rotate-12 group-hover:rotate-0 transition-transform duration-1000"></i>
        </div>
      </div>

      <div className="bg-[#001c38]/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-[#DAA520]/20 flex flex-col lg:flex-row gap-6 items-center shadow-2xl print:hidden">
        <div className="relative flex-1 w-full group">
          <i className="fas fa-user absolute right-5 top-1/2 -translate-y-1/2 text-[#DAA520]"></i>
          <input 
            type="text" 
            placeholder="البحث بالاسم أو اسم الشهيد..."
            className="w-full pr-14 pl-6 py-4 bg-black/40 border border-[#DAA520]/20 rounded-2xl outline-none focus:ring-4 focus:ring-[#DAA520]/10 focus:border-[#DAA520]/60 transition-all text-white font-black placeholder-slate-600 shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="relative flex-1 w-full group">
          <i className="fas fa-id-card absolute right-5 top-1/2 -translate-y-1/2 text-[#DAA520]"></i>
          <input 
            type="text" 
            placeholder="البحث بالرقم الوطني..."
            className="w-full pr-14 pl-6 py-4 bg-black/40 border border-[#DAA520]/20 rounded-2xl outline-none focus:ring-4 focus:ring-[#DAA520]/10 focus:border-[#DAA520]/60 transition-all text-white font-black placeholder-slate-600 shadow-inner"
            value={nationalIdSearch}
            onChange={(e) => setNationalIdSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-4 w-full lg:w-auto">
          <select 
            className="px-6 py-4 bg-black/40 border border-[#DAA520]/20 rounded-2xl outline-none font-black text-xs text-[#DAA520] cursor-pointer"
            value={relationshipFilter}
            onChange={(e) => setRelationshipFilter(e.target.value)}
          >
            <option value="all">كل صلات القرابة</option>
            <option value="زوجة">زوجة</option>
            <option value="ابن">ابن</option>
            <option value="أم">أم</option>
            <option value="أب">أب</option>
          </select>
        </div>
      </div>

      <div className="bg-[#001c38]/30 backdrop-blur-sm rounded-[3rem] shadow-2xl border border-[#DAA520]/10 overflow-hidden relative min-h-[400px] print:hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-[#001529] text-[#DAA520] text-[10px] font-black uppercase tracking-[0.2em] border-b border-[#DAA520]/20">
                <th className="px-8 py-6">الرمز</th>
                <th className="px-8 py-6">الاسم والبيانات</th>
                <th className="px-8 py-6 text-center">صلة القرابة</th>
                <th className="px-8 py-6">الشهيد</th>
                <th className="px-8 py-6 text-center">المنحة</th>
                <th className="px-8 py-6 text-center">الحالة</th>
                <th className="px-8 py-6 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-[#DAA520]/5 transition-colors group">
                  <td className="px-8 py-6 font-mono text-[10px] text-slate-500">{item.barcode}</td>
                  <td className="px-8 py-6">
                    <div className="font-black text-white text-lg">{item.fullName}</div>
                    <div className="text-[10px] text-slate-500 font-mono font-bold">{item.nationalId}</div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="bg-[#001529] text-[#DAA520] px-4 py-1.5 rounded-xl text-[10px] font-black border border-[#DAA520]/20">
                      {item.relationship}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-xs text-slate-400 font-bold">{item.martyrName}</td>
                  <td className="px-8 py-6 text-center font-black text-[#DAA520]">{item.lastGrantAmount?.toLocaleString()} د.ل</td>
                  <td className="px-8 py-6 text-center">
                    <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black border ${getStatusStyle(item.status as RecordStatus)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex justify-center gap-2">
                       <button 
                         onClick={() => handlePrintCertificate(item)} 
                         className="p-2 text-[#DAA520] hover:bg-[#DAA520]/20 rounded-lg transition-all" 
                         title="طباعة إفادة ملكية"
                       >
                         <i className="fas fa-print text-xl"></i>
                       </button>
                       {canEdit && <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg"><i className="fas fa-edit"></i></button>}
                       {canDelete && <button onClick={() => handleDelete(item.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg"><i className="fas fa-trash"></i></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 backdrop-blur-md bg-black/60 print:hidden">
          <div className="bg-[#001c38] border border-[#DAA520]/30 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-scaleIn">
            <div className="p-8 border-b border-[#DAA520]/20 bg-[#001529]/50 flex justify-between items-center">
              <h3 className="text-xl font-black text-[#DAA520]">{editingItem?.id ? 'تعديل مستفيد' : 'إضافة مستفيد جديد'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#DAA520] hover:scale-110 transition-transform"><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSave} className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2 col-span-2">
                  <label className="text-xs font-black text-slate-400 uppercase">الاسم الكامل للمستفيد</label>
                  <input required value={editingItem?.fullName || ''} onChange={e => setEditingItem({...editingItem!, fullName: e.target.value})} className="w-full bg-black/40 border border-[#DAA520]/10 rounded-xl p-4 text-white outline-none focus:border-[#DAA520]" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase">الرقم الوطني</label>
                  <input required value={editingItem?.nationalId || ''} onChange={e => setEditingItem({...editingItem!, nationalId: e.target.value})} className="w-full bg-black/40 border border-[#DAA520]/10 rounded-xl p-4 text-white outline-none focus:border-[#DAA520]" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase">صلة القرابة</label>
                  <select value={editingItem?.relationship || 'زوجة'} onChange={e => setEditingItem({...editingItem!, relationship: e.target.value})} className="w-full bg-black/40 border border-[#DAA520]/10 rounded-xl p-4 text-[#DAA520] outline-none">
                    <option value="زوجة">زوجة</option>
                    <option value="ابن">ابن</option>
                    <option value="ابنة">ابنة</option>
                    <option value="أم">أم</option>
                    <option value="أب">أب</option>
                  </select>
                </div>
                <div className="space-y-2 col-span-2">
                  <label className="text-xs font-black text-slate-400 uppercase">اسم الشهيد التابع له</label>
                  <input required value={editingItem?.martyrName || ''} onChange={e => setEditingItem({...editingItem!, martyrName: e.target.value})} className="w-full bg-black/40 border border-[#DAA520]/10 rounded-xl p-4 text-white outline-none focus:border-[#DAA520]" />
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <button type="submit" className="flex-1 py-4 bg-[#DAA520] text-[#000b14] rounded-xl font-black shadow-lg">حفظ البيانات</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-white/5 text-slate-400 rounded-xl font-black">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BeneficiariesInquiry;
