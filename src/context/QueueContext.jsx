import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { api, SOCKET_URL } from '../utils/api';
import {
  INITIAL_BRANCHES,
  INITIAL_SERVICES,
  INITIAL_STAFF,
  INITIAL_TICKETS,
  INITIAL_DEVICES,
  INITIAL_AUDIT_LOGS,
  STAFF_STATUS,
  TICKET_STATUS,
  TICKET_PRIORITY,
} from '../constants/initialData';
import { playChime, playPrintSound, announceTicket } from '../utils/audio';

const QueueContext = createContext(null);

const STORAGE_KEY = 'qms_storage_v6';
const CHANNEL_NAME = 'qms_broadcast_v6';

function getSafeArray(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function normalizeStaff(s) {
  if (!s) return s;
  return {
    ...s,
    branchId: s.branch_id || s.branchId || 'branch-1',
    roleId: s.role_id || s.roleId || 'OPERATOR',
    windowNumber: s.window_number || s.windowNumber || '1',
    servedCountToday: s.served_count_today ?? s.servedCountToday ?? 0,
    noShowCountToday: s.no_show_count_today ?? s.noShowCountToday ?? 0,
    totalServiceMinutes: s.total_service_minutes ?? s.totalServiceMinutes ?? 0,
    currentTicketId: s.current_ticket_id || s.currentTicketId || null,
    pauseReason: s.pause_reason || s.pauseReason || null,
    authorizedServiceIds: (s.authorizedServiceIds || s.authorized_service_ids || ['srv-general', 'srv-accounting']).filter(Boolean),
  };
}

export function getCustomerCode(t) {
  if (!t) return 'CUST-D3A6F293';
  if (t.customerCode) return t.customerCode;
  if (t.customer_code) return t.customer_code;
  if (t.clientIdentifier && t.clientIdentifier.startsWith('CUST-')) return t.clientIdentifier;
  if (t.client_identifier && t.client_identifier.startsWith('CUST-')) return t.client_identifier;
  
  // Deterministic 8-char hex code from id or ticketNumber
  const raw = String(t.id || t.ticketNumber || 'CUST');
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash * 31 + raw.charCodeAt(i)) & 0xffffffff;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0').slice(0, 8);
  return `CUST-${hex}`;
}

function normalizeTicket(t) {
  if (!t) return t;
  const custCode = t.customer_code || t.customerCode || (t.clientIdentifier && t.clientIdentifier.startsWith('CUST-') ? t.clientIdentifier : null) || getCustomerCode(t);
  return {
    ...t,
    ticketNumber: t.ticket_number || t.ticketNumber,
    branchId: t.branch_id || t.branchId || 'branch-1',
    serviceId: t.service_id || t.serviceId,
    staffId: t.staff_id || t.staffId,
    windowNumber: t.window_number || t.windowNumber,
    clientName: t.client_name || t.clientName,
    clientPhone: t.client_phone || t.clientPhone,
    customerCode: custCode,
    clientIdentifier: custCode,
    createdAt: typeof t.createdAt === 'number' ? t.createdAt : (t.created_at ? new Date(t.created_at).getTime() : Date.now()),
    calledAt: typeof t.calledAt === 'number' ? t.calledAt : (t.called_at ? new Date(t.called_at).getTime() : null),
    startedAt: typeof t.startedAt === 'number' ? t.startedAt : (t.started_at ? new Date(t.started_at).getTime() : null),
    completedAt: typeof t.completedAt === 'number' ? t.completedAt : (t.completed_at ? new Date(t.completed_at).getTime() : null),
  };
}

export function QueueProvider({ children }) {
  const [branches, setBranches] = useState(() => getSafeArray(STORAGE_KEY + '_branches', INITIAL_BRANCHES));
  const [services, setServices] = useState(() => getSafeArray(STORAGE_KEY + '_services', INITIAL_SERVICES));
  const [staff, setStaff] = useState(() => getSafeArray(STORAGE_KEY + '_staff', INITIAL_STAFF));
  const [tickets, setTickets] = useState(() => getSafeArray(STORAGE_KEY + '_tickets', INITIAL_TICKETS));
  const [devices, setDevices] = useState(() => getSafeArray(STORAGE_KEY + '_devices', INITIAL_DEVICES));
  const [auditLogs, setAuditLogs] = useState(() => getSafeArray(STORAGE_KEY + '_audit', INITIAL_AUDIT_LOGS));
  const [staffRequests, setStaffRequests] = useState(() => getSafeArray(STORAGE_KEY + '_staff_requests', []));

  const [activeBranchId, setActiveBranchId] = useState(() => {
    try {
      localStorage.setItem(STORAGE_KEY + '_branchId', 'branch-1');
      return 'branch-1';
    } catch {
      return 'branch-1';
    }
  });

  // Current logged in user (Sinxron holat)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const u = localStorage.getItem('qms_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });

  const logoutUser = useCallback(() => {
    localStorage.removeItem('qms_auth_token');
    localStorage.removeItem('qms_user');
    localStorage.removeItem('qms_admin_auth');
    localStorage.removeItem('qms_staff_auth_id');
    setCurrentUser(null);
    window.location.href = '/login';
  }, []);

  const [activeStaffId, setActiveStaffId] = useState(() => {
    return (INITIAL_STAFF[0] && INITIAL_STAFF[0].id) || 'staff-1';
  });

  const [lastCalledTicket, setLastCalledTicket] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [centralQueueRouting, setCentralQueueRouting] = useState(true);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  const [operatorAlerts, setOperatorAlerts] = useState([
    {
      id: 'alt-1',
      sender: 'Boshqaruvchi',
      message: 'Bugungi kunlik reja 150 mijoz. Iltimos, xizmat ko‘rsatish vaqtini 8 daqiqadan oshirmang.',
      time: '09:30',
    },
  ]);

  const broadcastChannelRef = useRef(null);
  const socketRef = useRef(null);

  // Sync state from Backend PostgreSQL
  const syncWithBackend = useCallback(async () => {
    try {
      const data = await api.getState(activeBranchId);
      if (data && data.success) {
        if (data.branches?.length) setBranches(data.branches);
        if (data.services?.length) setServices(data.services);
        if (data.staff?.length) setStaff(data.staff.map(normalizeStaff));
        if (Array.isArray(data.tickets)) setTickets(data.tickets.map(normalizeTicket));
        if (data.devices?.length) setDevices(data.devices);
        if (data.auditLogs?.length) setAuditLogs(data.auditLogs);
        setIsBackendConnected(true);
      }
    } catch (e) {
      // Backend may be offline or starting, silent fallback to local storage
      setIsBackendConnected(false);
    }
  }, [activeBranchId]);

  // Initial fetch and on branch change
  useEffect(() => {
    syncWithBackend();
    const timer = setInterval(syncWithBackend, 15000); // 15s polling fallback
    return () => clearInterval(timer);
  }, [syncWithBackend]);

  // WebSocket Real-time listener
  useEffect(() => {
    let socket;
    try {
      socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        setIsBackendConnected(true);
        socket.emit('join:branch', activeBranchId);
      });

      socket.on('disconnect', () => {
        setIsBackendConnected(false);
      });

      socket.on('ticket:created', (data) => {
        if (data?.ticket) {
          setTickets((prev) => {
            const exists = prev.some((t) => t.id === data.ticket.id);
            return exists ? prev : [data.ticket, ...prev];
          });
        }
      });

      socket.on('ticket:called', (data) => {
        const calledTicket = normalizeTicket(data?.ticket);
        if (calledTicket) {
          setLastCalledTicket(calledTicket);
          setTickets((prev) =>
            prev.map((t) => (t.id === calledTicket.id ? { ...t, ...calledTicket } : t))
          );
          if (data.operator) {
            setStaff((prev) =>
              prev.map((s) =>
                s.id === data.operator.id
                  ? { ...s, status: STAFF_STATUS.BUSY, currentTicketId: calledTicket.id }
                  : s
              )
            );
          }
          if (audioEnabled) playChime();
        }
      });

      socket.on('ticket:updated', (data) => {
        setTickets((prev) =>
          prev.map((t) => (t.id === data.queueId ? { ...t, status: data.status } : t))
        );
      });

      socket.on('ticket:completed', (data) => {
        setTickets((prev) =>
          prev.map((t) =>
            t.id === data.queueId ? { ...t, status: TICKET_STATUS.COMPLETED, completedAt: Date.now() } : t
          )
        );
        syncWithBackend();
      });

      socket.on('staff:status_changed', (data) => {
        setStaff((prev) =>
          prev.map((s) => (s.id === data.staffId ? { ...s, status: data.status, pauseReason: data.pauseReason } : s))
        );
      });

      socket.on('ticket:recalled', (data) => {
        if (data?.ticket) {
          setLastCalledTicket(data.ticket);
          if (audioEnabled) playChime();
          if (speechEnabled) {
            announceTicket(data.ticket.ticket_number || data.ticket.ticketNumber, data.windowNumber);
          }
        }
      });

      socket.on('state:reset', () => syncWithBackend());
      socket.on('queue:cleared', () => syncWithBackend());
      socket.on('service:updated', () => syncWithBackend());
      socket.on('service:deleted', () => syncWithBackend());
    } catch (e) {
      console.warn('Socket connection error:', e);
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [activeBranchId, audioEnabled, speechEnabled, syncWithBackend]);

  // BroadcastChannel for cross-tab local sync
  useEffect(() => {
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      broadcastChannelRef.current = channel;

      channel.onmessage = (event) => {
        const { type, payload } = event.data || {};
        if (type === 'STATE_SYNC' && payload) {
          if (Array.isArray(payload.tickets)) setTickets(payload.tickets);
          if (Array.isArray(payload.staff)) setStaff(payload.staff);
          if (payload.lastCalledTicket) {
            setLastCalledTicket(payload.lastCalledTicket);
            if (audioEnabled) playChime();
            if (speechEnabled) {
              announceTicket(
                payload.lastCalledTicket.ticketNumber || payload.lastCalledTicket.ticket_number,
                payload.lastCalledTicket.windowNumber || payload.lastCalledTicket.window_number
              );
            }
          }
        }
      };

      return () => {
        channel.close();
      };
    }
  }, [audioEnabled, speechEnabled]);

  // Persist local backup
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY + '_branches', JSON.stringify(branches));
      localStorage.setItem(STORAGE_KEY + '_services', JSON.stringify(services));
      localStorage.setItem(STORAGE_KEY + '_staff', JSON.stringify(staff));
      localStorage.setItem(STORAGE_KEY + '_tickets', JSON.stringify(tickets));
      localStorage.setItem(STORAGE_KEY + '_devices', JSON.stringify(devices));
      localStorage.setItem(STORAGE_KEY + '_audit', JSON.stringify(auditLogs));
      localStorage.setItem(STORAGE_KEY + '_branchId', activeBranchId);
    } catch (e) {}
  }, [branches, services, staff, tickets, devices, auditLogs, activeBranchId]);

  const addAuditLog = (action, details, operatorId = null, ticketNumber = null) => {
    const newLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
      action,
      details,
      operatorId,
      ticketNumber,
    };
    setAuditLogs((prev) => [newLog, ...(prev || [])].slice(0, 100));
    return newLog;
  };

  /**
   * KIOSK: Create ticket without any personal data (Section 2 & 10)
   * Supports anonymous customer code and referral code
   */
  const createTicket = async (serviceId, isVip = false, anonymousCode = null, referralCode = null) => {
    try {
      const backendRes = await api.createTicket({
        branchId: activeBranchId,
        serviceId,
        isVip,
        anonymousCode,
        referralCode,
      });

      if (backendRes && backendRes.ticket) {
        const custCode = backendRes.ticket.customerCode || backendRes.ticket.customer_code || getCustomerCode(backendRes.ticket);
        const formattedTicket = {
          id: backendRes.ticket.id,
          ticketNumber: backendRes.ticket.ticket_number || backendRes.ticket.ticketNumber,
          serviceId: backendRes.ticket.service_id || serviceId,
          branchId: backendRes.ticket.branch_id || activeBranchId,
          status: backendRes.ticket.status,
          priority: backendRes.ticket.priority,
          customerCode: custCode,
          clientIdentifier: custCode,
          referralCode: backendRes.ticket.referralCode,
          createdAt: Date.now(),
        };

        setTickets((prev) => [formattedTicket, ...prev]);
        if (audioEnabled) playPrintSound();

        return {
          success: true,
          ticket: formattedTicket,
          service: backendRes.service,
          branch: backendRes.branch,
          waitingAhead: backendRes.waitingAhead,
          estWaitTimeMin: backendRes.estWaitTimeMin,
        };
      }
    } catch (err) {
      console.warn('Backend createTicket fallback:', err);
    }

    // Local fallback
    const branch = branches.find((b) => b.id === activeBranchId) || branches[0];
    const service = services.find((s) => s.id === serviceId && s.active) || services[0];
    const prefix = service?.prefix || 'A';
    const nextSeqNum = 1 + tickets.filter((t) => t.ticketNumber?.startsWith(`${prefix}-`)).length;
    const ticketNumber = `${prefix}-${nextSeqNum}`;

    const custHex = Math.abs((Date.now() ^ (nextSeqNum * 2654435761))).toString(16).toUpperCase().padStart(4, '0').slice(-4);
    const customerCode = anonymousCode || `CUST-${custHex}`;

    const newTicket = {
      id: `tick-${Date.now()}`,
      ticketNumber,
      serviceId,
      branchId: activeBranchId,
      status: TICKET_STATUS.WAITING,
      priority: isVip ? TICKET_PRIORITY.VIP : TICKET_PRIORITY.REGULAR,
      customerCode,
      clientIdentifier: customerCode,
      createdAt: Date.now(),
    };

    setTickets((prev) => [newTicket, ...prev]);
    if (audioEnabled) playPrintSound();

    return {
      success: true,
      ticket: newTicket,
      service,
      branch,
      waitingAhead: tickets.filter((t) => t.status === TICKET_STATUS.WAITING).length,
      estWaitTimeMin: 8,
    };
  };

  /**
   * Operator calls next customer (FIFO + concurrency safe)
   */
  const callNextCustomer = async (staffId, autoAdvance = false) => {
    try {
      const res = await api.callNext({ staffId, autoAdvance, branchId: activeBranchId });
      if (res.success && res.ticket) {
        const normalized = normalizeTicket(res.ticket);

        setLastCalledTicket(normalized);

        // Optimistically update tickets in state immediately
        setTickets((prev) => {
          const updated = prev.map((t) => {
            if (t.id === normalized.id) return { ...t, ...normalized, status: TICKET_STATUS.CALLED, staffId };
            if (t.staffId === staffId && (t.status === TICKET_STATUS.CALLED || t.status === TICKET_STATUS.IN_SERVICE)) {
              return { ...t, status: TICKET_STATUS.COMPLETED, completedAt: Date.now() };
            }
            return t;
          });
          if (!updated.some((t) => t.id === normalized.id)) {
            updated.unshift(normalized);
          }
          return updated;
        });

        // Optimistically update staff state
        setStaff((prev) =>
          prev.map((s) =>
            s.id === staffId ? { ...s, status: STAFF_STATUS.BUSY, currentTicketId: normalized.id } : s
          )
        );

        syncWithBackend();

        // 1 marta ding-dong musiqa
        if (audioEnabled) playChime();

        return {
          success: true,
          ticket: normalized,
          operator: res.operator,
          previousCompleted: res.previousCompleted,
          message: res.message,
        };
      } else if (res.empty) {
        return { success: false, empty: true, message: res.message || 'Kutayotgan navbatlar yo‘q.' };
      }
      return { success: false, error: res?.error || res?.message || 'Navbat chaqirib bo‘lmadi' };
    } catch (err) {
      console.warn('Backend callNext fallback error:', err.message);
      return { success: false, error: err.message };
    }
  };

  /**
   * Recall customer
   */
  const recallCustomer = async (ticketId) => {
    try {
      await api.recallCustomer(ticketId, activeStaffId);
    } catch (e) {
      console.warn('Backend recallCustomer error:', e);
    }
  };

  /**
   * Start Service
   */
  const startService = async (ticketId) => {
    try {
      await api.startService(ticketId, activeStaffId);
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: TICKET_STATUS.IN_SERVICE, startedAt: Date.now() } : t))
      );
    } catch (e) {
      console.warn('Backend startService error:', e);
    }
  };

  /**
   * Complete Service
   */
  const completeService = async (ticketId) => {
    try {
      await api.completeService(ticketId, activeStaffId);
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: TICKET_STATUS.COMPLETED, completedAt: Date.now() } : t))
      );
      setStaff((prev) =>
        prev.map((s) => (s.id === activeStaffId ? { ...s, status: STAFF_STATUS.AVAILABLE, currentTicketId: null } : s))
      );
      syncWithBackend();
    } catch (e) {
      console.warn('Backend completeService error:', e);
    }
  };

  /**
   * Mark customer as NO_SHOW
   */
  const markNoShow = async (ticketId) => {
    try {
      await api.markNoShow(ticketId, activeStaffId);
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: TICKET_STATUS.NO_SHOW, completedAt: Date.now() } : t))
      );
      setStaff((prev) =>
        prev.map((s) => (s.id === activeStaffId ? { ...s, status: STAFF_STATUS.AVAILABLE, currentTicketId: null } : s))
      );
      syncWithBackend();
      return { success: true };
    } catch (e) {
      console.warn('Backend markNoShow error:', e);
      return { success: false, error: e.message };
    }
  };

  /**
   * Transfer Ticket
   */
  const transferTicket = async (ticketId, targetServiceId) => {
    try {
      await api.transferTicket(ticketId, targetServiceId, activeStaffId);
      syncWithBackend();
    } catch (e) {
      console.warn('Backend transferTicket error:', e);
    }
  };

  /**
   * Update Staff status (AVAILABLE, PAUSED, OFFLINE)
   */
  const updateStaffStatus = async (staffId, newStatus, pauseReason = null) => {
    try {
      await api.updateStaffStatus(staffId, newStatus, pauseReason);
      setStaff((prev) =>
        prev.map((s) => (s.id === staffId ? { ...s, status: newStatus, pauseReason } : s))
      );
      syncWithBackend();
    } catch (e) {
      console.warn('Backend updateStaffStatus error:', e);
    }
  };

  /**
   * Admin actions
   */
  const addStaff = async (staffData) => {
    try {
      const res = await api.addStaff(staffData);
      if (res.success && res.staff) {
        const formatted = normalizeStaff(res.staff);
        setStaff((prev) => [...prev.filter((s) => s.id !== formatted.id), formatted]);
        syncWithBackend();
        return { success: true, staff: formatted };
      }
      return { success: false, error: res?.error || 'Xodim qo‘shib bo‘lmadi' };
    } catch (e) {
      console.warn('Backend addStaff error:', e);
      return { success: false, error: e.message };
    }
  };

  const updateStaff = async (staffId, staffData) => {
    try {
      const res = await api.updateStaff(staffId, staffData);
      if (res.success && res.staff) {
        const formatted = normalizeStaff(res.staff);
        setStaff((prev) => prev.map((s) => (s.id === staffId ? { ...s, ...formatted } : s)));
        syncWithBackend();
        return { success: true, staff: formatted };
      }
      return { success: false, error: res?.error || 'Xodimni tahrirlab bo‘lmadi' };
    } catch (e) {
      console.warn('Backend updateStaff error:', e);
      return { success: false, error: e.message };
    }
  };

  const createBranch = async (branchData) => {
    try {
      const res = await api.createBranch(branchData);
      if (res.success && res.branch) {
        setBranches((prev) => [...prev, res.branch]);
        syncWithBackend();
        return { success: true, branch: res.branch };
      }
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const updateBranch = async (branchId, branchData) => {
    try {
      const res = await api.updateBranch(branchId, branchData);
      if (res.success && res.branch) {
        setBranches((prev) => prev.map((b) => (b.id === branchId ? { ...b, ...res.branch } : b)));
        syncWithBackend();
        return { success: true, branch: res.branch };
      }
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const deleteStaff = async (staffId) => {
    try {
      await api.deleteStaff(staffId);
      setStaff((prev) => prev.filter((s) => s.id !== staffId));
      syncWithBackend();
      return { success: true };
    } catch (e) {
      console.warn('Backend deleteStaff error:', e);
      return { success: false, error: e.message };
    }
  };

  const submitStaffRequest = async (requestData) => {
    try {
      const res = await api.registerRequest(requestData);
      return res;
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const approveStaffRequest = async (requestId) => {
    try {
      const res = await api.approveStaffRequest(requestId);
      syncWithBackend();
      return res;
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const rejectStaffRequest = async (requestId) => {
    try {
      const res = await api.rejectStaffRequest(requestId);
      syncWithBackend();
      return res;
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const restartDevice = async (deviceId) => {
    try {
      await api.restartDevice(deviceId);
      setDevices((prev) =>
        prev.map((d) => (d.id === deviceId ? { ...d, status: 'ONLINE', lastPing: 'Hozirgina' } : d))
      );
    } catch (e) {}
  };

  const toggleDeviceStatus = async (deviceId) => {
    try {
      await api.toggleDeviceStatus(deviceId);
      setDevices((prev) =>
        prev.map((d) => (d.id === deviceId ? { ...d, status: d.status === 'ONLINE' ? 'OFFLINE' : 'ONLINE' } : d))
      );
    } catch (e) {}
  };

  const addService = async (serviceData) => {
    try {
      const res = await api.createService(serviceData);
      if (res.success && res.service) {
        const formatted = {
          ...res.service,
          avgDurationMin: res.service.avg_duration_min || res.service.avgDurationMin || 10,
        };
        setServices((prev) => [...prev, formatted]);
        syncWithBackend();
        return { success: true, service: formatted };
      }
      return { success: false, error: res?.error || 'Bo‘lim qo‘shishda xatolik yuz berdi' };
    } catch (e) {
      console.warn('Backend addService error:', e);
      const newSrv = {
        id: `srv-${Date.now()}`,
        name: serviceData.name,
        prefix: serviceData.prefix,
        description: serviceData.description || '',
        avgDurationMin: serviceData.avgDurationMin || 10,
        active: serviceData.active !== false,
      };
      setServices((prev) => [...prev, newSrv]);
      return { success: true, service: newSrv };
    }
  };

  const updateService = async (serviceId, serviceData) => {
    try {
      const res = await api.updateService(serviceId, serviceData);
      if (res.success && res.service) {
        setServices((prev) =>
          prev.map((s) =>
            s.id === serviceId
              ? {
                  ...s,
                  ...res.service,
                  avgDurationMin: res.service.avg_duration_min || res.service.avgDurationMin,
                }
              : s
          )
        );
        syncWithBackend();
        return { success: true, service: res.service };
      }
      return { success: false, error: res?.error || 'Bo‘limni tahrirlashda xatolik yuz berdi' };
    } catch (e) {
      console.warn('Backend updateService error:', e);
      return { success: false, error: e.message };
    }
  };

  const toggleServiceActive = async (serviceId) => {
    try {
      await api.toggleService(serviceId);
      setServices((prev) => prev.map((s) => (s.id === serviceId ? { ...s, active: !s.active } : s)));
    } catch (e) {}
  };

  const deleteService = async (serviceId) => {
    try {
      if (isBackendConnected) {
        await api.deleteService(serviceId);
      }
    } catch (e) {
      console.warn('Backend deleteService error:', e);
    }
    setServices((prev) => prev.filter((s) => s.id !== serviceId));
    syncWithBackend();
    return { success: true };
  };

  const resetToDemo = async () => {
    try {
      await api.resetDemo();
      syncWithBackend();
    } catch (e) {}
  };

  const clearQueue = async () => {
    try {
      await api.clearQueue(activeBranchId);
      setTickets([]);
      syncWithBackend();
    } catch (e) {}
  };

  return (
    <QueueContext.Provider
      value={{
        branches: branches || INITIAL_BRANCHES,
        services: services || INITIAL_SERVICES,
        staff: staff || INITIAL_STAFF,
        tickets: tickets || INITIAL_TICKETS,
        devices: devices || INITIAL_DEVICES,
        auditLogs: auditLogs || INITIAL_AUDIT_LOGS,
        currentUser,
        setCurrentUser,
        logoutUser,
        operatorAlerts: operatorAlerts || [],
        staffRequests: staffRequests || [],
        activeBranchId,
        setActiveBranchId,
        activeStaffId,
        setActiveStaffId,
        lastCalledTicket,
        audioEnabled,
        setAudioEnabled,
        speechEnabled,
        setSpeechEnabled,
        centralQueueRouting,
        setCentralQueueRouting,
        isBackendConnected,
        createTicket,
        callNextCustomer,
        recallCustomer,
        startService,
        completeService,
        markNoShow,
        transferTicket,
        updateStaffStatus,
        restartDevice,
        toggleDeviceStatus,
        addStaff,
        updateStaff,
        deleteStaff,
        createBranch,
        updateBranch,
        submitStaffRequest,
        approveStaffRequest,
        rejectStaffRequest,
        addService,
        updateService,
        deleteService,
        toggleServiceActive,
        resetToDemo,
        clearQueue,
        syncWithBackend,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
}

export function useQueue() {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
}
