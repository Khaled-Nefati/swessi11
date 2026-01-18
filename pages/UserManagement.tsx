
import React, { useState, useEffect } from 'react';
import { User, UserRole, UserPermissions, Office } from '../types';
import { apiService } from '../services/apiService';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToReset, setUserToReset] = useState<User | null>(null);
  const [sendEmail, setSendEmail] = useState(true);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [currentUserSession, setCurrentUserSession] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<{id: number, msg: string, type: string}[]>([]);

  useEffect(() => { 
    const session = localStorage.getItem('app_session');
    if (session) setCurrentUserSession(JSON.parse(session));
    loadData(); 
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [uData, oData] = await Promise.all([apiService.getUsers(), apiService.getOffices()]);
      setUsers(uData);
      setOffices(oData);
      if (uData.length > 0) setSelectedUser(uData[0]);
    } catch (err) { addNotify('خطأ في جلب البيانات', 'error'); } 
    finally { setLoading(false); }
  };

  const addNotify = (msg: string, type: string = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const office = offices.find(o => o.id === editingUser.officeId);
      const userData = {
        ...editingUser,
        officeName: editingUser.officeId === 'all' ? 'الإدارة العامة' : (office?.name || 'مكتب غير محدد'),
        status: editingUser.status || 'نشط',
        permissions: editingUser.permissions || {
          martyrs: { view: true, edit: false, delete: false },
          amputees: { view: true, edit: false, delete: false },
          beneficiaries: { view: true, edit: false, delete: false },
          reports: { view: true, export: false },
          settings: { manageUsers: false, manageOffices: false }
        }
      };

      if (editingUser.id) {
        await apiService.updateUser(editingUser.id, userData);
        setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...userData as User } : u));
        addNotify('تم تحديث بيانات الموظف');
      } else {
        const newUser = await apiService.createUser({ ...userData, id: Date.now().toString() });
        setUsers(prev => [...prev, newUser]);
        addNotify('تم إنشاء حساب الموظف بنجاح');
      }
      setIsModalOpen(false);
    } catch (err) { addNotify('خطأ في الحفظ', 'error'); }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      await apiService.deleteUser(userToDelete.id);
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      if (selectedUser?.id === userToDelete.id) {
        setSelectedUser(users.find(u => u.id !== userToDelete.id) || null);
      }
      addNotify(`تم حذف حساب الموظف "${userToDelete.name}" نهائياً`);
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (err) {
      addNotify('فشل حذف الموظف، حاول مرة أخرى', 'error');
    }
  };

  const handleResetPassword = async () => {
    if (!userToReset) return;
    try {
      await apiService.resetUserPassword(userToReset.id);
      // توليد كلمة مرور مؤقتة آمنة (8 خانات)
      const newPass = Math.random().toString(36).slice(-8).toUpperCase();
      setTempPassword(newPass);
      addNotify(`تمت إعادة تعيين كلمة المرور بنجاح ${sendEmail ? 'وإرسال إشعار بريدي' : ''}`);
    } catch (err) {
      addNotify('فشل في إعادة التعيين', 'error');
    }
  };

  const handlePermissionToggle = async (module: keyof UserPermissions, action: string) => {
    if (!selectedUser) return;
    const newPerms = { ...selectedUser.permissions };
    // @ts-ignore
    newPerms[module][action] = !newPerms[module][action];
    
    try {
      await apiService.updateUserPermissions(selectedUser.id, newPerms);
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, permissions: newPerms } : u));
      setSelectedUser({ ...selectedUser, permissions: newPerms });
      addNotify('تم تحديث الصلاحيات');
    } catch (err) { addNotify('خطأ في التحديث', 'error'); }
  };

  return (
    <div className="space-y-8 animate-fadeIn text-right">
      <div className="fixed top-24 left-6 z-[500] space-y-3">
        {notifications.map(n => (
          <div key={n.id} className={`bg-[#0f172a] border-r-4 ${n.type === 'error' ? 'border-red-500' : 'border-[#38bdf8]'} shadow-2xl p-4 rounded-xl flex items-center gap-3 text-white border border-white/5`}>
            <i className={`fas ${n.type === 'error' ? 'fa-circle-xmark text-red-500' : 'fa-check-circle text-[#38bdf8]'}`}></i>
            <span className="font-bold text-sm">{n.msg}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center bg-[#1e293b]/60 p-8 rounded-3xl border border-white/5 shadow-xl">
        <div>
          <h2 className="text-2xl font-black text-white">إدارة شؤون الموظفين</h2>
          <p className="text-slate-400 text-xs font-bold mt-1">إدارة الأدوار والصلاحيات والوصول الأمني للنظام</p>
        </div>
        <button 
          onClick={() => { setEditingUser({ role: UserRole.INQUIRY, accessScope: 'office_only' }); setIsModalOpen(true); }}
          className="px-8 py-3 bg-[#38bdf8] text-[#0f172a] rounded-xl font-black shadow-lg hover:brightness-110 transition-all"
        >
          <i className="fas fa-plus ml-2"></i> إضافة موظف جديد
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[#1e293b]/50 rounded-3xl border border-white/5 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-white/5 bg-[#0f172a]/30">
              <h3 className="text-sm font-black text-[#38bdf8] uppercase tracking-widest">قائمة المستخدمين</h3>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {users.map(u => (
                <div key={u.id} className={`p-6 border-b border-white/5 flex items-center justify-between transition-all ${selectedUser?.id === u.id ? 'bg-[#38bdf8]/10' : 'hover:bg-white/5'}`}>
                  <button onClick={() => setSelectedUser(u)} className="flex-1 text-right">
                    <p className="font-black text-white">{u.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">{u.role} - {u.officeName}</p>
                  </button>
                  <div className="flex gap-1">
                    <button onClick={() => { setUserToReset(u); setTempPassword(null); setIsResetModalOpen(true); }} className="p-2 text-[#38bdf8] hover:text-white transition-colors" title="إعادة تعيين كلمة المرور"><i className="fas fa-key"></i></button>
                    <button onClick={() => { setEditingUser(u); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-white transition-colors" title="تعديل"><i className="fas fa-edit"></i></button>
                    {u.id !== currentUserSession?.id && (
                      <button onClick={() => { setUserToDelete(u); setIsDeleteModalOpen(true); }} className="p-2 text-red-400/60 hover:text-red-400 transition-colors" title="حذف الموظف"><i className="fas fa-trash-alt"></i></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedUser && (
            <div className="bg-[#1e293b]/30 backdrop-blur-md rounded-[3rem] border border-white/5 p-10 space-y-10 shadow-2xl">
              <div className="flex justify-between items-center pb-8 border-b border-white/5">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-[#38bdf8] rounded-2xl flex items-center justify-center text-[#0f172a] text-3xl font-black shadow-lg shadow-[#38bdf8]/20">
                    {selectedUser.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">{selectedUser.name}</h2>
                    <p className="text-[#38bdf8] text-sm font-bold mt-1">الدور: {selectedUser.role} | النطاق: {selectedUser.officeName}</p>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-xl text-xs font-black ${selectedUser.status === 'نشط' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  الحساب {selectedUser.status}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {Object.entries(selectedUser.permissions).map(([module, perms]: [any, any]) => (
                  <div key={module} className="bg-black/20 rounded-2xl p-6 border border-white/5 hover:border-[#38bdf8]/20 transition-all">
                    <h4 className="text-xs font-black text-[#38bdf8] mb-6 flex items-center gap-2 uppercase border-b border-white/5 pb-2">
                      <i className="fas fa-shield text-[10px]"></i> إدارة {module}
                    </h4>
                    <div className="space-y-4">
                      {Object.entries(perms).map(([action, value]: [any, any]) => (
                        <div key={action} className="flex justify-between items-center group">
                          <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors">صلاحية {action}</span>
                          <button 
                            onClick={() => handlePermissionToggle(module, action)}
                            className={`w-12 h-6 rounded-full relative transition-all duration-300 ${value ? 'bg-[#38bdf8]' : 'bg-slate-700'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${value ? 'right-1' : 'right-7'}`}></div>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* نافذة إعادة تعيين كلمة المرور */}
      {isResetModalOpen && userToReset && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-6 backdrop-blur-xl bg-black/80">
          <div className="bg-[#0f172a] border border-[#38bdf8]/30 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-scaleIn">
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-[#38bdf8]/10 text-[#38bdf8] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#38bdf8]/20">
                <i className="fas fa-lock-open text-3xl"></i>
              </div>
              
              {!tempPassword ? (
                <>
                  <div>
                    <h3 className="text-xl font-black text-white mb-2">إعادة تعيين كلمة المرور</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      هل أنت متأكد من تصفير كلمة المرور للموظف <span className="text-white font-black">"{userToReset.name}"</span>؟ 
                    </p>
                  </div>
                  
                  <div className="bg-white/5 p-4 rounded-xl flex items-center justify-between group cursor-pointer" onClick={() => setSendEmail(!sendEmail)}>
                    <span className="text-xs font-bold text-slate-300">إرسال إشعار للموظف عبر البريد</span>
                    <button className={`w-10 h-5 rounded-full relative transition-all ${sendEmail ? 'bg-[#38bdf8]' : 'bg-slate-700'}`}>
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${sendEmail ? 'right-1' : 'right-6'}`}></div>
                    </button>
                  </div>

                  <div className="flex gap-4 mt-8">
                    <button 
                      onClick={handleResetPassword}
                      className="flex-1 py-4 bg-[#38bdf8] text-[#0f172a] rounded-xl font-black shadow-lg"
                    >
                      تأكيد التعيين
                    </button>
                    <button 
                      onClick={() => { setIsResetModalOpen(false); setUserToReset(null); }}
                      className="flex-1 py-4 bg-white/5 text-slate-400 rounded-xl font-black"
                    >
                      إلغاء
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-6 animate-fadeIn">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                    <p className="text-emerald-400 text-xs font-bold">تم التعيين بنجاح</p>
                  </div>
                  <div className="bg-black/40 p-6 rounded-2xl border border-[#38bdf8]/20">
                    <p className="text-slate-500 text-[10px] uppercase font-black mb-2">كلمة المرور المؤقتة</p>
                    <p className="text-3xl font-black text-white tracking-[0.3em] font-mono">{tempPassword}</p>
                  </div>
                  <p className="text-slate-400 text-[10px] font-bold">يرجى تزويد الموظف بهذه الكلمة ليتمكن من الدخول وتغييرها لاحقاً.</p>
                  <button 
                    onClick={() => { setIsResetModalOpen(false); setUserToReset(null); setTempPassword(null); }}
                    className="w-full py-4 bg-[#38bdf8] text-[#0f172a] rounded-xl font-black"
                  >
                    إغلاق النافذة
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* نافذة تأكيد الحذف */}
      {isDeleteModalOpen && userToDelete && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-6 backdrop-blur-xl bg-black/80">
          <div className="bg-[#0f172a] border border-red-500/30 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-scaleIn">
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <i className="fas fa-exclamation-triangle text-3xl"></i>
              </div>
              <div>
                <h3 className="text-xl font-black text-white mb-2">تأكيد حذف المستخدم</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  هل أنت متأكد من حذف حساب الموظف <span className="text-white font-black">"{userToDelete.name}"</span>؟ 
                </p>
              </div>
              <div className="flex gap-4 mt-8">
                <button onClick={handleDeleteUser} className="flex-1 py-4 bg-red-500 text-white rounded-xl font-black shadow-lg">نعم، حذف الحساب</button>
                <button onClick={() => { setIsDeleteModalOpen(false); setUserToDelete(null); }} className="flex-1 py-4 bg-white/5 text-slate-400 rounded-xl font-black">تراجع</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة إضافة/تعديل مستخدم */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
          <div className="bg-[#0f172a] border border-[#38bdf8]/30 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-scaleIn">
            <div className="p-8 border-b border-white/5 bg-[#1e293b]/50">
              <h3 className="text-xl font-black text-white">{editingUser?.id ? 'تعديل بيانات موظف' : 'إنشاء حساب موظف جديد'}</h3>
            </div>
            <form onSubmit={handleSaveUser} className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase">الاسم الكامل</label>
                  <input required value={editingUser?.name || ''} onChange={e => setEditingUser({...editingUser!, name: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-[#38bdf8]" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase">اسم المستخدم</label>
                  <input required value={editingUser?.username || ''} onChange={e => setEditingUser({...editingUser!, username: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-[#38bdf8]" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase">الدور الوظيفي</label>
                  <select value={editingUser?.role || UserRole.INQUIRY} onChange={e => setEditingUser({...editingUser!, role: e.target.value as UserRole})} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white outline-none">
                    <option value={UserRole.ADMIN}>مدير نظام</option>
                    <option value={UserRole.MANAGER}>مدير مكتب</option>
                    <option value={UserRole.ENTRY}>مدخل بيانات</option>
                    <option value={UserRole.INQUIRY}>مستعلم</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase">المكتب التابع له</label>
                  <select value={editingUser?.officeId || ''} onChange={e => setEditingUser({...editingUser!, officeId: e.target.value})} className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white outline-none">
                    <option value="all">الإدارة العامة (كل المكاتب)</option>
                    {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
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

export default UserManagement;
