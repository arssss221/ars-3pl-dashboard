export type VehicleStatus = 'Working' | 'Reserved' | 'Servicing' | 'Unavailable';
export type VehicleHealth = 'Good' | 'Due Soon' | 'Attention';
export type FuelAllowanceStatus = 'On' | 'Off' | 'No Sim';

export interface VehicleSeed {
  id: number;
  slNo: number;
  vehicleNumber: string;
  plateNumber: string;
  vehicleType: string;
  model: string;
  brand: string;
  year: number;
  color: string;
  sequenceNo: string;
  status: VehicleStatus;
  health: VehicleHealth;
  authRider: string;
  authRiderImageUrl: string;
  authStatus: string;
  authExpiryDate: string;
  authRecord: string;
  assignedRider: string;
  riderPhone: string;
  driver: string;
  driverImageUrl: string;
  branch: string;
  place: string;
  category: string;
  chassisNumber: string;
  engineNumber: string;
  importDate: string;
  registrationExpiry: string;
  insuranceProvider: string;
  insuranceExpiry: string;
  roadPermitExpiry: string;
  lastOilChange: string;
  nextOilDue: string;
  lastService: string;
  nextServiceDue: string;
  mileage: number;
  oilChangeInterval: number;
  accidentCount: number;
  description: string;
  historyRecord: string;
  petrolAllowance: string;
  fuelAllowanceStatus: FuelAllowanceStatus;
  picUrl: string;
  istemaraUrl: string;
  opCardUrl: string;
  notes: string;
}

export const vehicleSeeds: VehicleSeed[] = [
  {
    id: 1,
    slNo: 1,
    vehicleNumber: 'KA-01-1234',
    plateNumber: 'KSA 4312',
    vehicleType: 'Van',
    model: 'Hiace',
    brand: 'Toyota',
    year: 2022,
    color: 'White',
    sequenceNo: 'SEQ-1001',
    status: 'Working',
    health: 'Good',
    authRider: 'Md. Rahim Uddin',
    authRiderImageUrl: '',
    authStatus: 'Active',
    authExpiryDate: '2027-01-18',
    authRecord: 'AUTH-2026-0001',
    assignedRider: 'Md. Rahim Uddin',
    riderPhone: '+8801712345678',
    driver: 'Md. Rahim Uddin',
    driverImageUrl: '',
    branch: 'Dhaka Main',
    place: 'Riyadh North Hub',
    category: 'Van',
    chassisNumber: 'JTFSX22P7N0012345',
    engineNumber: '2TR-987654',
    importDate: '2022-02-14',
    registrationExpiry: '2027-02-18',
    insuranceProvider: 'Tawuniya',
    insuranceExpiry: '2027-01-30',
    roadPermitExpiry: '2027-02-01',
    lastOilChange: '2026-03-12',
    nextOilDue: '2026-06-12',
    lastService: '2026-02-28',
    nextServiceDue: '2026-05-28',
    mileage: 48250,
    oilChangeInterval: 5000,
    accidentCount: 0,
    description: 'Daily delivery van assigned to rider operation.',
    historyRecord: 'No major incident. Regular maintenance completed.',
    petrolAllowance: 'SAR 650/month',
    fuelAllowanceStatus: 'On',
    picUrl: '',
    istemaraUrl: '',
    opCardUrl: '',
    notes: 'Ready for daily rider operations.',
  },
  {
    id: 2,
    slNo: 2,
    vehicleNumber: 'KA-02-5678',
    plateNumber: 'KSA 7821',
    vehicleType: 'Bike',
    model: 'Boxer',
    brand: 'Bajaj',
    year: 2021,
    color: 'Black',
    sequenceNo: 'SEQ-1002',
    status: 'Servicing',
    health: 'Attention',
    authRider: 'Shahidul Islam',
    authRiderImageUrl: '',
    authStatus: 'Pending Renewal',
    authExpiryDate: '2026-05-01',
    authRecord: 'AUTH-2025-0042',
    assignedRider: 'Shahidul Islam',
    riderPhone: '+8801912345678',
    driver: 'Shahidul Islam',
    driverImageUrl: '',
    branch: 'Chittagong',
    place: 'Dammam Delivery Zone',
    category: 'Bike',
    chassisNumber: 'MD2A18AZ6MW543210',
    engineNumber: 'BX-442211',
    importDate: '2021-06-02',
    registrationExpiry: '2026-05-04',
    insuranceProvider: 'Bupa Arabia',
    insuranceExpiry: '2026-05-15',
    roadPermitExpiry: '2026-04-28',
    lastOilChange: '2026-01-20',
    nextOilDue: '2026-04-20',
    lastService: '2026-01-05',
    nextServiceDue: '2026-04-25',
    mileage: 73640,
    oilChangeInterval: 3000,
    accidentCount: 1,
    description: 'Bike currently under maintenance review.',
    historyRecord: 'Minor accident recorded. Brake inspection pending.',
    petrolAllowance: 'SAR 300/month',
    fuelAllowanceStatus: 'Off',
    picUrl: '',
    istemaraUrl: '',
    opCardUrl: '',
    notes: 'Brake inspection and rear tire replacement pending.',
  },
  {
    id: 3,
    slNo: 3,
    vehicleNumber: 'KA-03-7711',
    plateNumber: 'KSA 9904',
    vehicleType: 'Scooter',
    model: 'Activa',
    brand: 'Honda',
    year: 2023,
    color: 'Silver',
    sequenceNo: 'SEQ-1003',
    status: 'Reserved',
    health: 'Due Soon',
    authRider: 'Masud Rana',
    authRiderImageUrl: '',
    authStatus: 'Active',
    authExpiryDate: '2026-07-10',
    authRecord: 'AUTH-2026-0017',
    assignedRider: 'Masud Rana',
    riderPhone: '+8801512345678',
    driver: 'Masud Rana',
    driverImageUrl: '',
    branch: 'Dhaka Main',
    place: 'Jeddah South Hub',
    category: 'Scooter',
    chassisNumber: 'ME4JF50BCP8011122',
    engineNumber: 'AC-220045',
    importDate: '2023-08-19',
    registrationExpiry: '2028-08-11',
    insuranceProvider: 'MedGulf',
    insuranceExpiry: '2026-06-02',
    roadPermitExpiry: '2026-06-15',
    lastOilChange: '2026-02-10',
    nextOilDue: '2026-05-10',
    lastService: '2026-03-03',
    nextServiceDue: '2026-06-03',
    mileage: 21480,
    oilChangeInterval: 2500,
    accidentCount: 0,
    description: 'Scooter for lightweight route operations.',
    historyRecord: 'Clean history. Oil change due soon.',
    petrolAllowance: 'SAR 280/month',
    fuelAllowanceStatus: 'No Sim',
    picUrl: '',
    istemaraUrl: '',
    opCardUrl: '',
    notes: 'Oil change due soon. Keep on watch list.',
  },
  {
    id: 4,
    slNo: 4,
    vehicleNumber: 'KA-04-8842',
    plateNumber: 'KSA 1207',
    vehicleType: 'Pickup',
    model: 'H100',
    brand: 'Hyundai',
    year: 2020,
    color: 'Blue',
    sequenceNo: 'SEQ-1004',
    status: 'Unavailable',
    health: 'Attention',
    authRider: 'Unassigned',
    authRiderImageUrl: '',
    authStatus: 'Not Assigned',
    authExpiryDate: '',
    authRecord: '',
    assignedRider: 'Unassigned',
    riderPhone: '',
    driver: 'Unassigned',
    driverImageUrl: '',
    branch: 'Sylhet',
    place: 'Warehouse Parking',
    category: 'Pickup',
    chassisNumber: 'KMFWBX7KLLU765432',
    engineNumber: 'D4BB-119900',
    importDate: '2020-11-25',
    registrationExpiry: '2026-04-30',
    insuranceProvider: '',
    insuranceExpiry: '',
    roadPermitExpiry: '2026-04-30',
    lastOilChange: '2025-11-14',
    nextOilDue: '2026-02-14',
    lastService: '2025-12-01',
    nextServiceDue: '2026-03-01',
    mileage: 118900,
    oilChangeInterval: 5000,
    accidentCount: 2,
    description: 'Inactive pickup waiting for documentation update.',
    historyRecord: 'Two previous incidents. Parked until compliance clearance.',
    petrolAllowance: 'Paused',
    fuelAllowanceStatus: 'Off',
    picUrl: '',
    istemaraUrl: '',
    opCardUrl: '',
    notes: 'Hold for documentation update before assignment.',
  },
];

export const getVehicleSeedById = (id: number) =>
  vehicleSeeds.find((vehicle) => vehicle.id === id);
