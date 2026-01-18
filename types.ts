
export enum UserRole {
  ADMIN = 'مدير النظام',
  MANAGER = 'مدير مكتب',
  ENTRY = 'مدخل بيانات',
  INQUIRY = 'مستعلم',
}

export enum UserCategory {
  DATA_ENTRY = 'مدخل بيانات',
  INQUIRY = 'مستعلم',
  EDITOR = 'تعديل بيانات',
  AUDITOR = 'مدقق جودة',
}

export interface UserPermissions {
  martyrs: { view: boolean; edit: boolean; delete: boolean; };
  amputees: { view: boolean; edit: boolean; delete: boolean; };
  beneficiaries: { view: boolean; edit: boolean; delete: boolean; };
  reports: { view: boolean; export: boolean; };
  settings: { manageUsers: boolean; manageOffices: boolean; };
}

export interface Office {
  id: string;
  name: string;
  location: string;
  contactPerson: string;
  phone: string;
  requiredDocsMartyrs: string[];
  requiredDocsAmputees: string[];
}

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  categories: UserCategory[];
  officeId: string;
  officeName: string;
  accessScope: 'office_only' | 'all_offices';
  status: 'نشط' | 'معطل';
  lastLogin?: string;
  permissions: UserPermissions;
}

export type RecordStatus = 'مستوفي' | 'غير مستوفي' | 'موقوف' | 'تحت الإجراء';

export interface Martyr {
  id: string;
  fullName: string;
  nationalId: string;
  dateOfMartyrdom: string;
  rank: string;
  office: string;
  status: RecordStatus;
  lastGrantAmount: number;
  barcode?: string;
}

export interface Beneficiary {
  id: string;
  fullName: string;
  nationalId: string;
  relationship: string;
  martyrName: string;
  benefitAmount: number;
  lastGrantAmount: number;
  status: RecordStatus;
  barcode?: string;
}

export interface Amputee {
  id: string;
  fullName: string;
  nationalId: string;
  injuryType: string;
  disabilityPercentage: number;
  office: string;
  lastPaymentDate: string;
  beneficiaryCount: number;
  status: RecordStatus;
  lastGrantAmount: number;
  barcode?: string;
}

export interface DashboardStats {
  martyrsCount: number;
  beneficiariesCount: number;
  amputeesCount: number;
  totalBenefits: number;
}
