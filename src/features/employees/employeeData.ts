export type EmployeeStatus = 'Working' | 'Waiting' | 'Ready' | 'Leave';
export type CompletionStatus = 'Complete' | 'Not Complete';

export interface EmployeeDocuments {
  selfie: boolean;
  iqama: boolean;
  license: boolean;
  passport: boolean;
  medicalInfo: boolean;
  driverCard: boolean;
  ajeerContract: boolean;
}

export interface EmployeeBankAccountSeed {
  bank: string;
  ibanNo: string;
}

export interface EmployeeSeed {
  id: number;
  idNumber: string;
  nickName: string;
  arabicName: string;
  fullName: string;
  phoneNo: string;
  phoneNo2: string;
  email: string;
  occupationVisa: string;
  branch: string;
  status: EmployeeStatus;
  vehicleNumber: string;
  iqamaNumber: string;
  iqamaExpiry: string;
  dateOfBirth: string;
  passportNo: string;
  passportExpiry: string;
  nationality: string;
  entryDate: string;
  sponsor: string;
  accomodation: string;
  agreement: CompletionStatus;
  commitment: CompletionStatus;
  transferCount: string;
  healthInsuranceName: string;
  healthInsuranceExpiry: string;
  bankAccounts: EmployeeBankAccountSeed[];
  documents: EmployeeDocuments;
}

export const buildPlaceholderImage = (
  label: string,
  colors: { bg: string; fg: string } = { bg: '#ecfdf5', fg: '#065f46' }
) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="220" viewBox="0 0 320 220">
      <rect width="320" height="220" fill="${colors.bg}" />
      <text x="160" y="116" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="${colors.fg}">
        ${label}
      </text>
    </svg>`
  )}`;

export const PLACEHOLDER_PDF_URL =
  'data:application/pdf;base64,JVBERi0xLjQKJcfsj6IKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PgplbmRvYmoKMyAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDIgMCBSL01lZGlhQm94WzAgMCAzMDAgMTQ0XS9Db250ZW50cyA0IDAgUi9SZXNvdXJjZXM8PC9Gb250PDwvRjEgNSAwIFI+Pj4+PgplbmRvYmoKNCAwIG9iago8PC9MZW5ndGggNDQ+PnN0cmVhbQpCVAovRjEgMTIgVGYKNTAgOTAgVGQKKERvY3VtZW50IFByZXZpZXcpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKNSAwIG9iago8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMS9CYXNlRm9udC9IZWx2ZXRpY2E+PgplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNTMgMDAwMDAgbiAKMDAwMDAwMDEwNCAwMDAwMCBuIAowMDAwMDAwMjI5IDAwMDAwIG4gCjAwMDAwMDAzMjIgMDAwMDAgbiAKdHJhaWxlcgo8PC9TaXplIDYvUm9vdCAxIDAgUj4+CnN0YXJ0eHJlZgozOTEKJSVFT0Y=';

export const getSelfieUrl = (seed: EmployeeSeed) => {
  if (!seed.documents.selfie) return null;
  const initials =
    seed.fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'EM';
  return buildPlaceholderImage(initials, { bg: '#d1fae5', fg: '#065f46' });
};

export const isArabicLanguage = (language?: string) =>
  (language ?? document.documentElement.lang).toLowerCase().startsWith('ar');

export const getEmployeeDisplayName = (
  employee: Pick<EmployeeSeed, 'arabicName' | 'fullName'>,
  language?: string
) => {
  if (isArabicLanguage(language) && employee.arabicName.trim()) {
    return employee.arabicName;
  }
  return employee.fullName;
};

export const getEmployeeInitials = (
  employee: Pick<EmployeeSeed, 'arabicName' | 'fullName'>,
  language?: string
) => {
  const displayName = getEmployeeDisplayName(employee, language);
  if (isArabicLanguage(language)) {
    return displayName.trim().charAt(0) || 'م';
  }

  return (
    displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'EM'
  );
};

export const employeeSeeds: EmployeeSeed[] = [
  {
    id: 1,
    idNumber: 'EMP001',
    nickName: 'Rahim',
    arabicName: 'رحيم الدين',
    fullName: 'Md. Rahim Uddin',
    phoneNo: '+8801712345678',
    phoneNo2: '+8801987654321',
    email: 'rahim@arslogisticsmanager.com',
    occupationVisa: 'Logistics Manager',
    branch: 'Dhaka Main',
    status: 'Working',
    vehicleNumber: 'KA-01-1234',
    iqamaNumber: 'IQ-123456',
    iqamaExpiry: '2026-05-03',
    dateOfBirth: '1985-03-10',
    passportNo: 'A12345678',
    passportExpiry: '2028-12-31',
    nationality: 'Bangladeshi',
    entryDate: '2023-01-15',
    sponsor: 'ARS Logistics Manager',
    accomodation: 'Company Housing, Uttara',
    agreement: 'Not Complete',
    commitment: 'Complete',
    transferCount: '2',
    healthInsuranceName: 'Bupa Arabia',
    healthInsuranceExpiry: '2027-04-25',
    bankAccounts: [
      {
        bank: 'Islami Bank Bangladesh Ltd.',
        ibanNo: 'IBAN12345678901234567890',
      },
    ],
    documents: {
      selfie: true,
      iqama: true,
      license: true,
      passport: true,
      medicalInfo: true,
      driverCard: true,
      ajeerContract: true,
    },
  },
  {
    id: 2,
    idNumber: 'EMP002',
    nickName: 'Fatema',
    arabicName: 'فاطمة بيجوم',
    fullName: 'Fatema Begum',
    phoneNo: '+8801812345678',
    phoneNo2: '+8801960011223',
    email: 'fatema@arslogisticsmanager.com',
    occupationVisa: 'HR Executive',
    branch: 'Dhaka Main',
    status: 'Ready',
    vehicleNumber: '-',
    iqamaNumber: 'IQ-223456',
    iqamaExpiry: '2026-11-14',
    dateOfBirth: '1992-06-20',
    passportNo: 'B87654321',
    passportExpiry: '2029-01-15',
    nationality: 'Bangladeshi',
    entryDate: '2024-02-10',
    sponsor: 'ARS Group',
    accomodation: 'Self Accommodation',
    agreement: 'Complete',
    commitment: 'Complete',
    transferCount: '1',
    healthInsuranceName: 'MedGulf',
    healthInsuranceExpiry: '2027-01-10',
    bankAccounts: [
      {
        bank: 'Dutch-Bangla Bank',
        ibanNo: 'IBAN23000123456789012345',
      },
    ],
    documents: {
      selfie: true,
      iqama: true,
      license: false,
      passport: true,
      medicalInfo: true,
      driverCard: false,
      ajeerContract: true,
    },
  },
  {
    id: 3,
    idNumber: 'EMP003',
    nickName: 'Shahid',
    arabicName: 'شهيد الإسلام',
    fullName: 'Shahidul Islam',
    phoneNo: '+8801912345678',
    phoneNo2: '+8801911223344',
    email: 'shahidul@arslogisticsmanager.com',
    occupationVisa: 'Driver',
    branch: 'Chittagong',
    status: 'Waiting',
    vehicleNumber: 'KA-02-5678',
    iqamaNumber: 'IQ-323456',
    iqamaExpiry: '2026-04-20',
    dateOfBirth: '1988-11-04',
    passportNo: 'C11223344',
    passportExpiry: '2027-09-10',
    nationality: 'Indian',
    entryDate: '2022-08-02',
    sponsor: 'Logistics Partner',
    accomodation: 'Company Housing, Gulshan',
    agreement: 'Not Complete',
    commitment: 'Not Complete',
    transferCount: '3',
    healthInsuranceName: '',
    healthInsuranceExpiry: '',
    bankAccounts: [],
    documents: {
      selfie: false,
      iqama: true,
      license: true,
      passport: true,
      medicalInfo: false,
      driverCard: true,
      ajeerContract: false,
    },
  },
  {
    id: 4,
    idNumber: 'EMP004',
    nickName: 'Nusrat',
    arabicName: 'نصرت جهان',
    fullName: 'Nusrat Jahan',
    phoneNo: '+8801612345678',
    phoneNo2: '+8801611002200',
    email: 'nusrat@arslogisticsmanager.com',
    occupationVisa: 'Operations Coordinator',
    branch: 'Sylhet',
    status: 'Working',
    vehicleNumber: '-',
    iqamaNumber: 'IQ-423456',
    iqamaExpiry: '2028-01-30',
    dateOfBirth: '1995-01-17',
    passportNo: 'D55667788',
    passportExpiry: '2030-03-20',
    nationality: 'Pakistani',
    entryDate: '2025-01-21',
    sponsor: 'ARS Logistics Manager',
    accomodation: 'Self Accommodation',
    agreement: 'Complete',
    commitment: 'Complete',
    transferCount: '0',
    healthInsuranceName: 'Tawuniya',
    healthInsuranceExpiry: '2027-07-11',
    bankAccounts: [
      { bank: 'BRAC Bank', ibanNo: 'IBAN40000123456789012345' },
      { bank: 'City Bank', ibanNo: 'IBAN40000987654321012345' },
    ],
    documents: {
      selfie: true,
      iqama: true,
      license: true,
      passport: true,
      medicalInfo: true,
      driverCard: true,
      ajeerContract: true,
    },
  },
  {
    id: 5,
    idNumber: 'EMP005',
    nickName: 'Masud',
    arabicName: 'مسعود رنا',
    fullName: 'Masud Rana',
    phoneNo: '+8801512345678',
    phoneNo2: '+8801511778899',
    email: 'masud@arslogisticsmanager.com',
    occupationVisa: 'Driver',
    branch: 'Dhaka Main',
    status: 'Leave',
    vehicleNumber: 'KA-03-7711',
    iqamaNumber: 'IQ-523456',
    iqamaExpiry: '2026-04-17',
    dateOfBirth: '1990-12-09',
    passportNo: 'E88990011',
    passportExpiry: '2026-05-25',
    nationality: 'Nepali',
    entryDate: '2021-11-06',
    sponsor: 'ARS Group',
    accomodation: 'Company Housing, Uttara',
    agreement: 'Not Complete',
    commitment: 'Complete',
    transferCount: '3+',
    healthInsuranceName: 'Bupa Arabia',
    healthInsuranceExpiry: '',
    bankAccounts: [],
    documents: {
      selfie: true,
      iqama: false,
      license: true,
      passport: true,
      medicalInfo: true,
      driverCard: false,
      ajeerContract: false,
    },
  },
];

export const getEmployeeSeedById = (id: number) =>
  employeeSeeds.find((employee) => employee.id === id);
