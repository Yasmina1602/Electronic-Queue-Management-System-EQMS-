// Backend REST API client for QMS

export const SOCKET_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? `${window.location.protocol}//${window.location.hostname}:5000`
    : 'http://localhost:5000');

export const API_BASE = `${SOCKET_URL}/api`;

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('qms_auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Server xatosi: ${response.status}`);
  }

  return data;
}

export const api = {
  // State
  getState: (branchId) => request(`/queues/state?branchId=${branchId || 'branch-1'}`),

  // Ticket & Queue
  createTicket: (payload) => request('/queues/ticket', { method: 'POST', body: JSON.stringify(payload) }),
  callNext: (payload) => request('/queues/next', { method: 'POST', body: JSON.stringify(payload) }),
  startService: (ticketId, staffId) => request(`/queues/${ticketId}/start`, { method: 'POST', body: JSON.stringify({ staffId }) }),
  completeService: (ticketId, staffId) => request(`/queues/${ticketId}/complete`, { method: 'POST', body: JSON.stringify({ staffId }) }),
  markNoShow: (ticketId, staffId) => request(`/queues/${ticketId}/no-show`, { method: 'POST', body: JSON.stringify({ staffId }) }),
  recallCustomer: (ticketId, staffId) => request(`/queues/${ticketId}/recall`, { method: 'POST', body: JSON.stringify({ staffId }) }),
  transferTicket: (ticketId, targetServiceId, staffId) =>
    request(`/queues/${ticketId}/transfer`, { method: 'POST', body: JSON.stringify({ targetServiceId, staffId }) }),

  // Auth & Staff
  login: (login, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ login, password }) }),
  getMe: () => request('/auth/me'),
  registerRequest: (payload) => request('/auth/register-request', { method: 'POST', body: JSON.stringify(payload) }),
  updateStaffStatus: (staffId, status, pauseReason) =>
    request(`/staff/${staffId}/status`, { method: 'PUT', body: JSON.stringify({ status, pauseReason }) }),
  addStaff: (payload) => request('/staff', { method: 'POST', body: JSON.stringify(payload) }),
  updateStaff: (staffId, payload) => request(`/staff/${staffId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteStaff: (staffId) => request(`/staff/${staffId}`, { method: 'DELETE' }),
  getStaffRequests: () => request('/staff/requests'),
  approveStaffRequest: (id) => request(`/staff/requests/${id}/approve`, { method: 'POST' }),
  rejectStaffRequest: (id) => request(`/staff/requests/${id}/reject`, { method: 'POST' }),

  // Loyalty & Referral (Section 10)
  lookupCustomer: (code) => request(`/loyalty/customer/${code}`),
  getLoyaltyStats: () => request('/loyalty/stats'),

  // Devices
  restartDevice: (id) => request(`/devices/${id}/restart`, { method: 'POST' }),
  toggleDeviceStatus: (id) => request(`/devices/${id}/status`, { method: 'PATCH' }),
  addDevice: (payload) => request('/devices', { method: 'POST', body: JSON.stringify(payload) }),
  deleteDevice: (id) => request(`/devices/${id}`, { method: 'DELETE' }),

  // Services & Branches
  createBranch: (payload) => request('/branches', { method: 'POST', body: JSON.stringify(payload) }),
  updateBranch: (branchId, payload) => request(`/branches/${branchId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteBranch: (branchId) => request(`/branches/${branchId}`, { method: 'DELETE' }),
  createService: (payload) => request('/services', { method: 'POST', body: JSON.stringify(payload) }),
  updateService: (serviceId, payload) => request(`/services/${serviceId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteService: (serviceId) => request(`/services/${serviceId}`, { method: 'DELETE' }),
  toggleService: (id) => request(`/services/${id}/toggle`, { method: 'PATCH' }),

  // Reports & Analytics
  getAnalytics: (branchId) => request(`/reports/analytics?branchId=${branchId || 'branch-1'}`),
  getAuditLogs: (branchId) => request(`/admin/audit-logs?branchId=${branchId || 'branch-1'}`),
  resetDemo: () => request('/admin/reset-demo', { method: 'POST' }),
  clearQueue: (branchId) => request('/admin/clear-queue', { method: 'POST', body: JSON.stringify({ branchId }) }),
};

