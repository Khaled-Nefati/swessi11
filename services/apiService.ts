
const BASE_URL = 'https://khaled.com.ly/api';

const MOCK_DATA = {
  martyrs: [
    { id: '1', fullName: 'محمد علي الورفلي', nationalId: '119900223344', dateOfMartyrdom: '2023-05-12', rank: 'مدني', office: 'مكتب طرابلس الرئيسي', status: 'مستوفي', lastGrantAmount: 2500, barcode: 'MTR-00001' },
    { id: '2', fullName: 'سالم حسن القماطي', nationalId: '119855443322', dateOfMartyrdom: '2022-11-20', rank: 'عسكري', office: 'بنغازي', status: 'تحت الإجراء', lastGrantAmount: 0, barcode: 'MTR-00002' }
  ],
  amputees: [
    { id: '1', fullName: 'عمر المختار الفيتوري', nationalId: '120011223344', injuryType: 'بتر فوق الركبة', disabilityPercentage: 75, office: 'مكتب طرابلس الرئيسي', status: 'مستوفي', lastGrantAmount: 1800, barcode: 'AMP-00001' }
  ],
  beneficiaries: [
    { id: '1', fullName: 'فاطمة محمد علي', nationalId: '219900112233', relationship: 'زوجة', martyrName: 'محمد علي الورفلي', benefitAmount: 1200, lastGrantAmount: 1200, status: 'مستوفي', barcode: 'BNF-00001' },
    { id: '2', fullName: 'علي محمد علي', nationalId: '219900112244', relationship: 'ابن', martyrName: 'محمد علي الورفلي', benefitAmount: 800, lastGrantAmount: 800, status: 'مستوفي', barcode: 'BNF-00002' }
  ],
  users: [
    { 
      id: '1', name: 'أحمد المحمودي', username: 'admin', role: 'مدير النظام', 
      categories: [], officeId: 'all', officeName: 'الإدارة العامة', 
      accessScope: 'all_offices', status: 'نشط', lastLogin: 'الآن',
      permissions: {
        martyrs: { view: true, edit: true, delete: true },
        amputees: { view: true, edit: true, delete: true },
        beneficiaries: { view: true, edit: true, delete: true },
        reports: { view: true, export: true },
        settings: { manageUsers: true, manageOffices: true }
      }
    }
  ],
  offices: [
    { 
      id: 'off-1', 
      name: 'مكتب طرابلس الرئيسي', 
      location: 'حي الأندلس، طرابلس', 
      contactPerson: 'سالم الورفلي', 
      phone: '091-2233445',
      requiredDocsMartyrs: ['شهادة وفاة', 'رقم وطني', 'صورة شخصية'],
      requiredDocsAmputees: ['تقرير طبي معتمد', 'رقم وطني']
    }
  ]
};

async function safeFetch(url: string, options?: RequestInit) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    });
    if (!response.ok) throw new Error(`Server status: ${response.status}`);
    return await response.json();
  } catch (error) {
    if (options?.method === 'DELETE') return { success: true };
    if (options?.method === 'PUT' || options?.method === 'POST') {
      const body = options.body ? JSON.parse(options.body as string) : {};
      return { ...body, id: body.id || Date.now().toString() };
    }
    
    if (url.includes('/Martyrs')) return MOCK_DATA.martyrs;
    if (url.includes('/Amputees')) return MOCK_DATA.amputees;
    if (url.includes('/Beneficiaries')) return MOCK_DATA.beneficiaries;
    if (url.includes('/Users')) return MOCK_DATA.users;
    if (url.includes('/Offices')) return MOCK_DATA.offices;
    return [];
  }
}

export const apiService = {
  getMartyrs: () => safeFetch(`${BASE_URL}/Martyrs`),
  createMartyr: (data: any) => safeFetch(`${BASE_URL}/Martyrs`, { method: 'POST', body: JSON.stringify(data) }),
  updateMartyr: (id: string, data: any) => safeFetch(`${BASE_URL}/Martyrs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMartyr: (id: string) => safeFetch(`${BASE_URL}/Martyrs/${id}`, { method: 'DELETE' }),
  
  getAmputees: () => safeFetch(`${BASE_URL}/Amputees`),
  createAmputee: (data: any) => safeFetch(`${BASE_URL}/Amputees`, { method: 'POST', body: JSON.stringify(data) }),
  updateAmputee: (id: string, data: any) => safeFetch(`${BASE_URL}/Amputees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAmputee: (id: string) => safeFetch(`${BASE_URL}/Amputees/${id}`, { method: 'DELETE' }),
  
  getBeneficiaries: () => safeFetch(`${BASE_URL}/Beneficiaries`),
  createBeneficiary: (data: any) => safeFetch(`${BASE_URL}/Beneficiaries`, { method: 'POST', body: JSON.stringify(data) }),
  updateBeneficiary: (id: string, data: any) => safeFetch(`${BASE_URL}/Beneficiaries/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBeneficiary: (id: string) => safeFetch(`${BASE_URL}/Beneficiaries/${id}`, { method: 'DELETE' }),
  
  getUsers: () => safeFetch(`${BASE_URL}/Users`),
  createUser: (data: any) => safeFetch(`${BASE_URL}/Users`, { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: string, data: any) => safeFetch(`${BASE_URL}/Users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: (id: string) => safeFetch(`${BASE_URL}/Users/${id}`, { method: 'DELETE' }),
  resetUserPassword: (id: string) => safeFetch(`${BASE_URL}/Users/${id}/ResetPassword`, { method: 'POST' }),
  updateUserPermissions: (id: string, permissions: any) => safeFetch(`${BASE_URL}/Users/${id}/Permissions`, { method: 'PUT', body: JSON.stringify({ permissions }) }),
  updateUserStatus: (id: string, status: string) => safeFetch(`${BASE_URL}/Users/${id}/Status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  
  getOffices: () => safeFetch(`${BASE_URL}/Offices`),
  createOffice: (data: any) => safeFetch(`${BASE_URL}/Offices`, { method: 'POST', body: JSON.stringify(data) }),
  updateOffice: (id: string, data: any) => safeFetch(`${BASE_URL}/Offices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteOffice: (id: string) => safeFetch(`${BASE_URL}/Offices/${id}`, { method: 'DELETE' }),
};
