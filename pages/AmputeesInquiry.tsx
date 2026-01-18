
import React, { useState, useMemo, useEffect } from 'react';
import { Amputee, RecordStatus, User } from '../types';
import { apiService } from '../services/apiService';

const AmputeesInquiry: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [amputees, setAmputees] = useState<Amputee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Amputee> | null>(null);
  const [notifications, setNotifications] = useState<{id: number, msg: string, type: string}[]>([]);

  useEffect(() => { 
    const savedUser = localStorage.getItem('app_session');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
    loadData(); 
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await apiService.getAmputees();
      setAmputees(data.map((a: any) => ({ ...a, barcode: a.barcode || `AMP-${a.id.toString().padStart(5, '0')}` })));
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const addNotify = (msg: string, type: string = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  };

  const filtered = useMemo(() => {
    let result = amputees;
    if (currentUser?.accessScope === 'office_only') {
      result = result.filter(a => a.office === currentUser.officeName);
    }
    return result.filter(a => {
      const matchesSearch = a.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || a.nationalId.includes(searchTerm);
      const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [amputees, searchTerm, statusFilter, currentUser]);

  const canEdit = currentUser?.permissions.amputees.edit;
  const canDelete = currentUser?.permissions.amputees.delete;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      if (editingItem.id) {
        await apiService.updateAmputee(editingItem.id, editingItem);
        setAmputees(prev => prev.map(a => a.id === editingItem.id ? { ...a, ...editingItem as Amputee } : a));
        addNotify('تم تحديث البيانات');
      } else {
        const newItem = await apiService.createAmputee({ ...editingItem, id: Date.now().toString(), office: currentUser?.officeName });
        setAmputees(prev => [...prev, newItem]);
        addNotify('تم إضافة السجل الجديد');
      }
      setIsModalOpen(false);
    } catch (err) { addNotify('خطأ في الحفظ', 'error'); }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('حذف هذا السجل؟')) {
      try {
        await apiService.deleteAmputee(id);
        setAmputees(prev => prev.filter(a => a.id !== id));
        addNotify('تم الحذف بنجاح');
      } catch (err) { addNotify('خطأ في الحذف', 'error'); }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="fixed top-24 left-6 z-[200] space-y-3">
        {notifications.map(n => (
          <div key={n.id} className={`bg-[#0f172a] border-r-4 ${n.type === 'error' ? 'border-red-500' : 'border-[#38bdf8]'} shadow-2xl p-4 rounded-xl flex items-center gap-3 text-white border border-white/5`}>
            <i className={`fas ${n.type === 'error' ? 'fa-circle-xmark text-red-500' : 'fa-check-circle text-[#38bdf8]'}`}></i>
            <span className="font-bold text-sm">{n.msg}</span>
          </div>
        ))}
      </div>

      <div className="bg-[#1e293b]/60 backdrop-blur-md p-8 rounded-3xl border border-white/5 flex flex-col lg:flex-row gap-6 items-center shadow-xl">
        <div className="relative flex-1 w-full group">
          <i className="fas fa-search absolute right-5 top-1/2 -translate-y-1/2 text-[#38bdf8]"></i>
          <input 
            type="text" 
            placeholder="البحث في سجل المبتورين..."
            className="w-full pr-14 pl-6 py-4 bg-black/40 border border-white/5 rounded-2xl outline-none focus:ring-4 focus:ring-[#38bdf8]/10 text-white font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {canEdit && (
          <button onClick={() => { setEditingItem({ status: 'مستوفي', disabilityPercentage: 0 }); setIsModalOpen(true); }} className="px-8 py-4 bg-[#38bdf8] text-[#0f172a] rounded-xl font-black">إضافة جديد</button>
        )}
      </div>

      <div className="bg-[#1e293b]/30 backdrop-blur-sm rounded-3xl shadow-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-[#0f172a] text-[#38bdf8] text-[10px] font-black uppercase tracking-widest">
                <th className="px-8 py-6">الاسم والبيانات</th>
                <th className="px-8 py-6">الرقم الوطني</th>
                <th className="px-8 py-6 text-center">نوع الإصابة</th>
                <th className="px-8 py-6 text-center">الحالة</th>
                {(canEdit || canDelete) && <th className="px-8 py-6 text-center">الإجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-8 py-6">
                    <div className="font-black text-white">{item.fullName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{item.barcode}</div>
                  </td>
                  <td className="px-8 py-6 text-slate-400 font-mono font-bold tracking-widest">{item.nationalId}</td>
                  <td className="px-8 py-6 text-center text-slate-300 font-bold">{item.injuryType}</td>
                  <td className="px-8 py-6 text-center">
                    <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black border ${item.status === 'مستوفي' ? 'text-emerald-400 border-emerald-500/20' : 'text-amber-400 border-amber-500/20'}`}>
                      {item.status}
                    </span>
                  </td>
                  {(canEdit || canDelete) && (
                    <td className="px-8 py-6 text-center">
                      <div className="flex gap-2 justify-center">
                        {canEdit && <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="p-2 text-blue-400"><i className="fas fa-edit"></i></button>}
                        {canDelete && <button onClick={() => handleDelete(item.id)} className="p-2 text-red-400"><i className="fas fa-trash"></i></button>}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
          <div className="bg-[#0f172a] border border-[#38bdf8]/30 w-full max-w-2xl rounded-[2.5rem] shadow-2xl animate-scaleIn">
            <div className="p-8 border-b border-white/5 bg-[#1e293b]/50">
              <h3 className="text-xl font-black text-white">{editingItem?.id ? 'تعديل سجل مبتور' : 'إضافة سجل جديد'}</h3>
            </div>
            <form onSubmit={handleSave} className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400">الاسم الكامل</label>
                  <input required value={editingItem?.fullName || ''} onChange={e => setEditingItem({...editingItem!, fullName: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-[#38bdf8]" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400">الرقم الوطني</label>
                  <input required value={editingItem?.nationalId || ''} onChange={e => setEditingItem({...editingItem!, nationalId: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-[#38bdf8]" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400">نوع الإصابة</label>
                  <input required value={editingItem?.injuryType || ''} onChange={e => setEditingItem({...editingItem!, injuryType: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-[#38bdf8]" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400">الحالة</label>
                  <select value={editingItem?.status || 'مستوفي'} onChange={e => setEditingItem({...editingItem!, status: e.target.value as RecordStatus})} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white outline-none">
                    <option value="مستوفي">مستوفي</option>
                    <option value="تحت الإجراء">تحت الإجراء</option>
                    <option value="موقوف">موقوف</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <button type="submit" className="flex-1 py-4 bg-[#38bdf8] text-[#0f172a] rounded-xl font-black shadow-lg">حفظ البيانات</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-white/5 text-slate-400 rounded-xl font-black">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AmputeesInquiry;
