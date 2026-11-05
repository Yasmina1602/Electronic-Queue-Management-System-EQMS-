// Initial Data & Constants for QMS (Elektron Navbat Boshqaruv Tizimi)

export const STAFF_STATUS = {
  OFFLINE: 'OFFLINE',
  AVAILABLE: 'AVAILABLE',
  BUSY: 'BUSY',
  PAUSED: 'PAUSED',
};

export const TICKET_STATUS = {
  WAITING: 'WAITING',
  CALLED: 'CALLED',
  IN_SERVICE: 'IN_SERVICE',
  COMPLETED: 'COMPLETED',
  NO_SHOW: 'NO_SHOW',
  CANCELLED: 'CANCELLED',
  TRANSFERRED: 'TRANSFERRED',
};

export const TICKET_PRIORITY = {
  REGULAR: 'REGULAR',
  VIP: 'VIP',
};

export const ROLES = {
  SUPERADMIN: 'SUPERADMIN',
  MANAGER: 'MANAGER',
  OPERATOR: 'OPERATOR',
};

export const INITIAL_BRANCHES = [
  {
    id: 'branch-1',
    name: 'Markaziy Bosh Filial',
    address: 'Amir Temur shoh ko‘chasi, 1-uy',
    code: 'MBF',
    phone: '+998 71 200-00-00',
    active: true,
  },
];

// 2 ta asosiy xizmat turi (Xizmatlar va Buxgalteriya)
export const INITIAL_SERVICES = [
  {
    id: 'srv-general',
    name: 'Xizmatlar',
    description: 'Kassa, Kreditlar, Omonatlar, Kartalar va ma’lumotlar',
    prefix: 'X',
    avgDurationMin: 8,
    icon: 'Layers',
    bgClass: 'bg-emerald-50 border-emerald-200 text-emerald-950',
    iconBg: 'bg-emerald-600 text-white',
    active: true,
    priorityWeight: 1,
    category: 'general',
  },
  {
    id: 'srv-accounting',
    name: 'Buxgalteriya',
    description: 'Hisob-kitoblar, Soliq, To‘lov topshiriqlari va yuridik shaxslar',
    prefix: 'B',
    avgDurationMin: 12,
    icon: 'Calculator',
    bgClass: 'bg-emerald-50 border-emerald-200 text-emerald-950',
    iconBg: 'bg-emerald-700 text-white',
    active: true,
    priorityWeight: 2,
    category: 'accounting',
  },
];

export const INITIAL_STAFF = [
  {
    id: 'staff-1',
    name: 'Sanjarbek Aliyev',
    login: 'OP-101',
    password: '123',
    phone: '214',
    windowNumber: '1',
    branchId: 'branch-1',
    authorizedServiceIds: ['srv-general', 'srv-accounting'],
    status: STAFF_STATUS.AVAILABLE,
    currentTicketId: null,
    pauseReason: null,
    servedCountToday: 0,
    noShowCountToday: 0,
    lastServiceFinishedAt: null,
    totalServiceMinutes: 0,
  },
  {
    id: 'staff-2',
    name: 'Madina Karimova',
    login: 'OP-102',
    password: '123',
    phone: '119',
    windowNumber: '2',
    branchId: 'branch-1',
    authorizedServiceIds: ['srv-general', 'srv-accounting'],
    status: STAFF_STATUS.AVAILABLE,
    currentTicketId: null,
    pauseReason: null,
    servedCountToday: 0,
    noShowCountToday: 0,
    lastServiceFinishedAt: null,
    totalServiceMinutes: 0,
  },
  {
    id: 'staff-3',
    name: 'Jasur Rahimov',
    login: 'OP-103',
    password: '123',
    phone: '103',
    windowNumber: '3',
    branchId: 'branch-1',
    authorizedServiceIds: ['srv-general', 'srv-accounting'],
    status: STAFF_STATUS.AVAILABLE,
    currentTicketId: null,
    pauseReason: null,
    servedCountToday: 0,
    noShowCountToday: 0,
    lastServiceFinishedAt: null,
    totalServiceMinutes: 0,
  },
  {
    id: 'staff-4',
    name: 'Nodira Umarova',
    login: 'OP-104',
    password: '123',
    phone: '104',
    windowNumber: '4',
    branchId: 'branch-1',
    authorizedServiceIds: ['srv-accounting'],
    status: STAFF_STATUS.AVAILABLE,
    currentTicketId: null,
    pauseReason: null,
    servedCountToday: 0,
    noShowCountToday: 0,
    lastServiceFinishedAt: null,
    totalServiceMinutes: 0,
  },
  {
    id: 'staff-5',
    name: 'Sardor Ahmedov',
    login: 'OP-105',
    password: '123',
    phone: '105',
    windowNumber: '5',
    branchId: 'branch-1',
    authorizedServiceIds: ['srv-general'],
    status: STAFF_STATUS.AVAILABLE,
    currentTicketId: null,
    pauseReason: null,
    servedCountToday: 0,
    noShowCountToday: 0,
    lastServiceFinishedAt: null,
    totalServiceMinutes: 0,
  },
];

export const INITIAL_TICKETS = [];

// Super Admin Devices (4-rasm)
export const INITIAL_DEVICES = [
  {
    id: 'dev-1',
    name: 'Kiosk-01',
    ipAddress: '192.168.1.1',
    type: 'KIOSK',
    status: 'ONLINE',
    lastPing: 'Hozirgina',
  },
  {
    id: 'dev-2',
    name: 'Counter-02',
    ipAddress: '192.168.1.24',
    type: 'OPERATOR',
    status: 'ONLINE',
    lastPing: 'Hozirgina',
  },
  {
    id: 'dev-3',
    name: 'Counter-03',
    ipAddress: '192.168.1.2',
    type: 'OPERATOR',
    status: 'ONLINE',
    lastPing: 'Hozirgina',
  },
  {
    id: 'dev-4',
    name: 'Tablo-TV-01',
    ipAddress: '192.168.1.55',
    type: 'DISPLAY',
    status: 'ONLINE',
    lastPing: 'Hozirgina',
  },
  {
    id: 'dev-5',
    name: 'Xprinter-XP80',
    ipAddress: '192.168.1.80',
    type: 'PRINTER',
    status: 'ONLINE',
    lastPing: 'Hozirgina',
  },
];

// Audit Log for manager & admin (2.7-band)
export const INITIAL_AUDIT_LOGS = [];
