
import React, { useState, useEffect } from 'react';
import { Office } from '../types';
import { apiService } from '../services/apiService';

const OfficesManagement: React.FC = () => {
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffice, setEditingOffice] = useState<Partial<Office>>({ requiredDocsMartyrs: [], requiredDocsAmputees: [] });
  const [notifications, setNotifications] = useState<{id: number, msg: string, type: string}[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try { 
      const data = await apiService.getOffices(); 
      setOffices(data); 
    } catch (err) { addNotify('خطأ في تحميل المكاتب', 'error'); } 
    finally { setLoading(false); }
  };

  const addNotify = (msg: string, type: string = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingOffice.id) {
        await apiService.updateOffice(editingOffice.id, editingOffice);
        setOffices(prev => prev.map(o => o.id === editingOffice.id ? { ...o, ...editingOffice as Office } : o));
        addNotify('تم تحديث بيانات المكتب');
      } else {
        const newOffice = await apiService.createOffice({ ...editingOffice, id: Date.now().toString() });
        setOffices(prev => [...prev, newOffice]);
        addNotify('تم إضافة المكتب الجديد');
      }
      setIsModalOpen(false);
    } catch (err) { addNotify('فشل حفظ البيانات', 'error'); }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من إزالة هذا المكتب نهائياً؟')) {
      try {
        await apiService.deleteOffice(id);
        setOffices(prev => prev.filter(o => o.id !== id));
        addNotify('تم حذف المكتب بنجاح');
      } catch (err) { addNotify('خطأ في الحذف', 'error'); }
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn text-right" dir="rtl">
      <div className="fixed top-24 left-6 z-[500] space-y-3">
        {notifications.map(n => (
          <div key={n.id} className={`bg-[#0f172a] border-r-4 ${n.type === 'error' ? 'border-red-500' : 'border-[#38bdf8]'} shadow-2xl p-4 rounded-xl flex items-center gap-3 text-white border border-white/5`}>
            <i className={`fas ${n.type === 'error' ? 'fa-circle-xmark text-red-500' : 'fa-check-circle text-[#38bdf8]'}`}></i>
            <span className="font-bold text-sm">{n.msg}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[#1e293b]/80 backdrop-blur-md p-10 rounded-[3rem] border border-white/5 shadow-2xl">
        <div>
          <h2 className="text-3xl font-black text-white">إدارة المكاتب الإقليمية</h2>
          <p className="text-slate-400 mt-2 font-bold text-xs uppercase">تحديد هيكلية الفروع والمتطلبات القانونية لكل مكتب</p>
        </div>
        <button 
          onClick={() => { setEditingOffice({ requiredDocsMartyrs: [], requiredDocsAmputees: [] }); setIsModalOpen(true); }}
          className="px-10 py-5 bg-[#38bdf8] text-[#0f172a] rounded-2xl font-black hover:brightness-110 shadow-xl"
        >
          <i className="fas fa-plus"></i> إضافة مكتب جديد
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {offices.map((office) => (
            <div key={office.id} className="bg-[#0f172a]/60 backdrop-blur-md p-10 rounded-[3.5rem] border border-white/5 hover:border-[#38bdf8]/30 transition-all flex flex-col group">
              <div className="flex justify-between items-start mb-8">
                <div className="w-16 h-16 bg-[#1e293b] text-[#38bdf8] rounded-2xl flex items-center justify-center text-3xl shadow-xl border border-white/5">
                  <i className="fas fa-building-columns"></i>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingOffice(office); setIsModalOpen(true); }} className="p-3 bg-white/5 text-slate-400 hover:text-white rounded-xl transition-colors"><i className="fas fa-edit"></i></button>
                  <button onClick={() => handleDelete(office.id)} className="p-3 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all"><i className="fas fa-trash"></i></button>
                </div>
              </div>
              <h3 className="text-3xl font-black text-white mb-2">{office.name}</h3>
              <p className="text-[#38bdf8] text-[10px] font-black flex items-center gap-2 mb-8"><i className="fas fa-location-dot"></i> {office.location}</p>
              
              <div className="grid grid-cols-2 gap-6 mt-auto">
                 <div className="p-5 bg-black/20 rounded-2xl border border-white/5">
                    <p className="text-[9px] text-slate-500 font-black mb-1">المسؤول</p>
                    <p className="font-black text-slate-300">{office.contactPerson}</p>
                 </div>
                 <div className="p-5 bg-black/20 rounded-2xl border border-white/5">
                    <p className="text-[9px] text-slate-500 font-black mb-1">الهاتف</p>
                    <p className="font-black font-mono text-slate-300">{office.phone}</p>
                 </div>
              </div>
            </div>
          ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
          <div className="bg-[#0f172a] border border-[#38bdf8]/30 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-scaleIn">
            <div className="p-8 border-b border-white/5 bg-[#1e293b]/50">
              <h3 className="text-xl font-black text-white">{editingOffice?.id ? 'تعديل بيانات المكتب' : 'إضافة مكتب جديد'}</h3>
            </div>
            <form onSubmit={handleSave} className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase">اسم المكتب</label>
                  <input required value={editingOffice?.name || ''} onChange={e => setEditingOffice({...editingOffice!, name: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-[#38bdf8]" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase">العنوان بالتفصيل</label>
                  <input required value={editingOffice?.location || ''} onChange={e => setEditingOffice({...editingOffice!, location: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-[#38bdf8]" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase">اسم المسؤول</label>
                  <input required value={editingOffice?.contactPerson || ''} onChange={e => setEditingOffice({...editingOffice!, contactPerson: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-[#38bdf8]" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase">هاتف التواصل</label>
                  <input required value={editingOffice?.phone || ''} onChange={e => setEditingOffice({...editingOffice!, phone: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-[#38bdf8]" />
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <button type="submit" className="flex-1 py-4 bg-[#38bdf8] text-[#0f172a] rounded-xl font-black shadow-lg">حفظ المكتب</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-white/5 text-slate-400 rounded-xl font-black">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficesManagement;
