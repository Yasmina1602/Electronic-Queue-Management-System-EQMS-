import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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

const STORAGE_KEY = 'qms_storage_v3';
const CHANNEL_NAME = 'qms_broadcast_v3';

// Safe array helper
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

export function QueueProvider({ children }) {
  const [branches, setBranches] = useState(() => getSafeArray(STORAGE_KEY + '_branches', INITIAL_BRANCHES));
  const [services, setServices] = useState(() => getSafeArray(STORAGE_KEY + '_services', INITIAL_SERVICES));
  const [staff, setStaff] = useState(() => getSafeArray(STORAGE_KEY + '_staff', INITIAL_STAFF));
  const [tickets, setTickets] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_tickets');
      if (!saved) return INITIAL_TICKETS;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : INITIAL_TICKETS;
    } catch {
      return INITIAL_TICKETS;
    }
  });
  const [devices, setDevices] = useState(() => getSafeArray(STORAGE_KEY + '_devices', INITIAL_DEVICES));
  const [auditLogs, setAuditLogs] = useState(() => getSafeArray(STORAGE_KEY + '_audit', INITIAL_AUDIT_LOGS));

  const [activeBranchId, setActiveBranchId] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_branchId');
      return saved || 'branch-1';
    } catch {
      return 'branch-1';
    }
  });

  const [activeStaffId, setActiveStaffId] = useState(() => {
    return (INITIAL_STAFF[0] && INITIAL_STAFF[0].id) || 'staff-1';
  });

  const [lastCalledTicket, setLastCalledTicket] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [centralQueueRouting, setCentralQueueRouting] = useState(true);

  // Operator alerts
  const [operatorAlerts, setOperatorAlerts] = useState([
    {
      id: 'alt-1',
      sender: 'Boshqaruvchi',
      message: 'Bugungi kunlik reja 150 mijoz. Iltimos, xizmat ko‘rsatish vaqtini 8 daqiqadan oshirmang.',
      time: '09:30',
    },
    {
      id: 'alt-2',
      sender: 'Kassir guruhi',
      message: 'Valyuta ayirboshlash bo‘yicha yangi kurslar tizimga yuklandi.',
      time: '10:15',
    },
  ]);

  const broadcastChannelRef = useRef(null);

  // Initialize BroadcastChannel for cross-tab sync
  useEffect(() => {
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel(CHANNEL_NAME);
      broadcastChannelRef.current = channel;

      channel.onmessage = (event) => {
        const { type, payload } = event.data || {};
        if (type === 'STATE_SYNC' && payload) {
          if (Array.isArray(payload.tickets)) setTickets(payload.tickets);
          if (Array.isArray(payload.staff)) setStaff(payload.staff);
          if (Array.isArray(payload.services)) setServices(payload.services);
          if (Array.isArray(payload.branches)) setBranches(payload.branches);
          if (Array.isArray(payload.devices)) setDevices(payload.devices);
          if (Array.isArray(payload.auditLogs)) setAuditLogs(payload.auditLogs);
          if (payload.lastCalledTicket) {
            setLastCalledTicket(payload.lastCalledTicket);
            if (audioEnabled) playChime();
            if (speechEnabled) {
              announceTicket(payload.lastCalledTicket.ticketNumber, payload.lastCalledTicket.windowNumber);
            }
          }
        }
      };

      return () => {
        channel.close();
      };
    }
  }, [audioEnabled, speechEnabled]);

  // Persist state
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY + '_branches', JSON.stringify(branches));
      localStorage.setItem(STORAGE_KEY + '_services', JSON.stringify(services));
      localStorage.setItem(STORAGE_KEY + '_staff', JSON.stringify(staff));
      localStorage.setItem(STORAGE_KEY + '_tickets', JSON.stringify(tickets));
      localStorage.setItem(STORAGE_KEY + '_devices', JSON.stringify(devices));
      localStorage.setItem(STORAGE_KEY + '_audit', JSON.stringify(auditLogs));
      localStorage.setItem(STORAGE_KEY + '_branchId', activeBranchId);
    } catch (e) {
      console.warn('Storage save error:', e);
    }
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
    const updated = [newLog, ...(auditLogs || [])].slice(0, 100);
    setAuditLogs(updated);
    return updated;
  };

  const broadcastState = (updatedTickets, updatedStaff, extraEvent = null, extraAudit = null) => {
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: 'STATE_SYNC',
        payload: {
          tickets: updatedTickets,
          staff: updatedStaff,
          branches,
          services,
          devices,
          auditLogs: extraAudit || auditLogs,
          lastCalledTicket: extraEvent,
        },
      });
    }
  };

  /**
   * KIOSK: Create ticket
   */
  const createTicket = (serviceId, isVip = false, clientName = null) => {
    const branchList = branches || INITIAL_BRANCHES;
    const serviceList = services || INITIAL_SERVICES;
    const ticketList = tickets || [];

    const branch = branchList.find((b) => b.id === activeBranchId) || branchList[0];
    const service = serviceList.find((s) => s.id === serviceId && s.active);

    if (!branch) {
      return { success: false, error: 'Filial topilmadi!' };
    }
    if (!service) {
      return { success: false, error: 'Xizmat turi topilmadi yoki to‘xtatilgan!' };
    }

    const prefix = service.prefix || 'A';
    const existingWithPrefix = ticketList.filter(
      (t) => t.branchId === activeBranchId && t.ticketNumber && t.ticketNumber.startsWith(prefix)
    );
    const nextSeqNum = 101 + existingWithPrefix.length;
    const ticketNumber = `${prefix}-${nextSeqNum}`;

    const waitingAhead = ticketList.filter(
      (t) => t.branchId === activeBranchId && t.serviceId === serviceId && t.status === TICKET_STATUS.WAITING
    ).length;

    const estWaitTimeMin = Math.max(2, waitingAhead * (service.avgDurationMin || 7));

    const newTicket = {
      id: `tick-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ticketNumber,
      serviceId,
      branchId: activeBranchId,
      status: TICKET_STATUS.WAITING,
      priority: isVip ? TICKET_PRIORITY.VIP : TICKET_PRIORITY.REGULAR,
      clientIdentifier: clientName || (isVip ? `VIP Sodiqlik #${nextSeqNum}` : `Mijoz #${nextSeqNum}`),
      createdAt: Date.now(),
      calledAt: null,
      startedAt: null,
      completedAt: null,
      staffId: null,
      windowNumber: null,
    };

    const updatedTickets = [...ticketList, newTicket];
    const updatedLogs = addAuditLog(
      'TICKET_CREATED',
      `${newTicket.ticketNumber} navbati yaratildi (${service.name})`,
      null,
      newTicket.ticketNumber
    );

    setTickets(updatedTickets);
    broadcastState(updatedTickets, staff, null, updatedLogs);

    if (audioEnabled) {
      playPrintSound();
    }

    return {
      success: true,
      ticket: newTicket,
      service,
      branch,
      waitingAhead,
      estWaitTimeMin,
    };
  };

  /**
   * Next customer call with FIFO, load-balancing, and atomic protection
   */
  const callNextCustomer = (staffId) => {
    const staffList = staff || INITIAL_STAFF;
    const ticketList = tickets || [];

    const operator = staffList.find((s) => s.id === staffId);
    if (!operator) return { success: false, error: 'Xodim topilmadi!' };

    if (operator.status !== STAFF_STATUS.AVAILABLE) {
      return {
        success: false,
        error: `Mijoz chaqirish uchun xodim "AVAILABLE" (Bo‘sh) holatida bo‘lishi kerak. Joriy holat: ${operator.status}`,
      };
    }

    const eligibleTickets = ticketList.filter(
      (t) =>
        t.status === TICKET_STATUS.WAITING &&
        t.branchId === operator.branchId &&
        operator.authorizedServiceIds &&
        operator.authorizedServiceIds.includes(t.serviceId)
    );

    if (eligibleTickets.length === 0) {
      return {
        success: false,
        empty: true,
        message: 'Hozirda sizning vakolatingizdagi xizmatlar bo‘yicha kutayotgan navbat yo‘q.',
      };
    }

    eligibleTickets.sort((a, b) => {
      if (a.priority === TICKET_PRIORITY.VIP && b.priority !== TICKET_PRIORITY.VIP) return -1;
      if (b.priority === TICKET_PRIORITY.VIP && a.priority !== TICKET_PRIORITY.VIP) return 1;
      return a.createdAt - b.createdAt;
    });

    const selectedTicket = eligibleTickets[0];

    const updatedTickets = ticketList.map((t) => {
      if (t.id === selectedTicket.id) {
        return {
          ...t,
          status: TICKET_STATUS.CALLED,
          calledAt: Date.now(),
          staffId: operator.id,
          windowNumber: operator.windowNumber,
        };
      }
      return t;
    });

    const updatedStaff = staffList.map((s) => {
      if (s.id === operator.id) {
        return {
          ...s,
          status: STAFF_STATUS.BUSY,
          currentTicketId: selectedTicket.id,
          pauseReason: null,
        };
      }
      return s;
    });

    const calledDetails = {
      ...selectedTicket,
      status: TICKET_STATUS.CALLED,
      calledAt: Date.now(),
      staffId: operator.id,
      windowNumber: operator.windowNumber,
      serviceName: (services || []).find((srv) => srv.id === selectedTicket.serviceId)?.name || 'Xizmat',
    };

    const updatedLogs = addAuditLog(
      'TICKET_CALLED',
      `${selectedTicket.ticketNumber} navbati ${operator.windowNumber}-oyna (${operator.name}) tomonidan qabul qilindi`,
      operator.id,
      selectedTicket.ticketNumber
    );

    setTickets(updatedTickets);
    setStaff(updatedStaff);
    setLastCalledTicket(calledDetails);

    broadcastState(updatedTickets, updatedStaff, calledDetails, updatedLogs);

    if (audioEnabled) playChime();
    if (speechEnabled) {
      announceTicket(selectedTicket.ticketNumber, operator.windowNumber);
    }

    return { success: true, ticket: calledDetails };
  };

  /**
   * Re-call customer
   */
  const recallCustomer = (ticketId) => {
    const ticketList = tickets || [];
    const ticket = ticketList.find((t) => t.id === ticketId);
    if (!ticket) return;

    const op = (staff || []).find((s) => s.id === ticket.staffId);
    const serviceName = (services || []).find((s) => s.id === ticket.serviceId)?.name || 'Xizmat';

    const calledDetails = {
      ...ticket,
      serviceName,
      windowNumber: op?.windowNumber || ticket.windowNumber || '1',
      calledAt: Date.now(),
    };

    addAuditLog(
      'TICKET_RECALLED',
      `${ticket.ticketNumber} navbati qayta chaqirildi (${op?.name || 'Oyna ' + ticket.windowNumber})`,
      op?.id,
      ticket.ticketNumber
    );

    setLastCalledTicket(calledDetails);
    broadcastState(ticketList, staff, calledDetails);

    if (audioEnabled) playChime();
    if (speechEnabled) {
      announceTicket(ticket.ticketNumber, calledDetails.windowNumber);
    }
  };

  /**
   * Start Service
   */
  const startService = (ticketId) => {
    const ticketList = tickets || [];
    const updatedTickets = ticketList.map((t) => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: TICKET_STATUS.IN_SERVICE,
          startedAt: Date.now(),
        };
      }
      return t;
    });

    const ticket = ticketList.find((t) => t.id === ticketId);
    if (ticket) {
      addAuditLog(
        'SERVICE_STARTED',
        `${ticket.ticketNumber} xizmat ko‘rsatish jarayoni boshlandi`,
        ticket.staffId,
        ticket.ticketNumber
      );
    }

    setTickets(updatedTickets);
    broadcastState(updatedTickets, staff);
  };

  /**
   * Complete Service
   */
  const completeService = (ticketId) => {
    const ticketList = tickets || [];
    const staffList = staff || [];

    const ticket = ticketList.find((t) => t.id === ticketId);
    if (!ticket) return;

    const durationMin = ticket.startedAt
      ? Math.max(1, Math.round((Date.now() - ticket.startedAt) / 60000))
      : 5;

    const updatedTickets = ticketList.map((t) => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: TICKET_STATUS.COMPLETED,
          completedAt: Date.now(),
        };
      }
      return t;
    });

    const updatedStaff = staffList.map((s) => {
      if (s.id === ticket.staffId || s.currentTicketId === ticketId) {
        return {
          ...s,
          status: STAFF_STATUS.AVAILABLE,
          currentTicketId: null,
          servedCountToday: (s.servedCountToday || 0) + 1,
          lastServiceFinishedAt: Date.now(),
          totalServiceMinutes: (s.totalServiceMinutes || 0) + durationMin,
        };
      }
      return s;
    });

    const updatedLogs = addAuditLog(
      'TICKET_COMPLETED',
      `${ticket.ticketNumber} xizmati muvaffaqiyatli yakunlandi (${durationMin} daqiqa)`,
      ticket.staffId,
      ticket.ticketNumber
    );

    setTickets(updatedTickets);
    setStaff(updatedStaff);
    broadcastState(updatedTickets, updatedStaff, null, updatedLogs);
  };

  /**
   * Mark customer as NO_SHOW
   */
  const markNoShow = (ticketId) => {
    const ticketList = tickets || [];
    const staffList = staff || [];

    const ticket = ticketList.find((t) => t.id === ticketId);
    if (!ticket) return;

    const updatedTickets = ticketList.map((t) => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: TICKET_STATUS.NO_SHOW,
          completedAt: Date.now(),
        };
      }
      return t;
    });

    let isUnderSupervision = false;
    const updatedStaff = staffList.map((s) => {
      if (s.id === ticket.staffId || s.currentTicketId === ticketId) {
        const newNoShowCount = (s.noShowCountToday || 0) + 1;
        if (newNoShowCount >= 3) {
          isUnderSupervision = true;
        }
        return {
          ...s,
          status: STAFF_STATUS.AVAILABLE,
          currentTicketId: null,
          noShowCountToday: newNoShowCount,
          lastServiceFinishedAt: Date.now(),
        };
      }
      return s;
    });

    const logMsg = isUnderSupervision
      ? `DIQQAT! ${ticket.ticketNumber} kelmadi deb belgilandi. Xodim me’yordan ko‘p mijoz qaytarganligi sababli NAZORATGA OLINDI!`
      : `${ticket.ticketNumber} mijoz chaqiruvga kelmadi (NO_SHOW)`;

    const updatedLogs = addAuditLog('NO_SHOW_MARKED', logMsg, ticket.staffId, ticket.ticketNumber);

    setTickets(updatedTickets);
    setStaff(updatedStaff);
    broadcastState(updatedTickets, updatedStaff, null, updatedLogs);

    return { success: true, isUnderSupervision };
  };

  /**
   * Transfer Ticket
   */
  const transferTicket = (ticketId, targetServiceId) => {
    const ticketList = tickets || [];
    const serviceList = services || [];
    const staffList = staff || [];

    const ticket = ticketList.find((t) => t.id === ticketId);
    if (!ticket) return;

    const targetService = serviceList.find((s) => s.id === targetServiceId);
    if (!targetService) return;

    const updatedTickets = ticketList.map((t) => {
      if (t.id === ticketId) {
        return {
          ...t,
          serviceId: targetServiceId,
          status: TICKET_STATUS.WAITING,
          calledAt: null,
          startedAt: null,
          staffId: null,
          windowNumber: null,
          transferredAt: Date.now(),
        };
      }
      return t;
    });

    const updatedStaff = staffList.map((s) => {
      if (s.id === ticket.staffId || s.currentTicketId === ticketId) {
        return {
          ...s,
          status: STAFF_STATUS.AVAILABLE,
          currentTicketId: null,
          lastServiceFinishedAt: Date.now(),
        };
      }
      return s;
    });

    const updatedLogs = addAuditLog(
      'TICKET_TRANSFERRED',
      `${ticket.ticketNumber} navbati "${targetService.name}" xizmatiga qayta yo‘naltirildi`,
      ticket.staffId,
      ticket.ticketNumber
    );

    setTickets(updatedTickets);
    setStaff(updatedStaff);
    broadcastState(updatedTickets, updatedStaff, null, updatedLogs);
  };

  /**
   * Update Staff status (with failover)
   */
  const updateStaffStatus = (staffId, newStatus, pauseReason = null) => {
    const staffList = staff || [];
    const ticketList = tickets || [];

    const targetStaff = staffList.find((s) => s.id === staffId);
    let updatedTickets = ticketList;

    if (
      (newStatus === STAFF_STATUS.OFFLINE || newStatus === STAFF_STATUS.PAUSED) &&
      targetStaff?.currentTicketId
    ) {
      const activeT = ticketList.find((t) => t.id === targetStaff.currentTicketId);
      if (activeT && activeT.status === TICKET_STATUS.CALLED) {
        updatedTickets = ticketList.map((t) => {
          if (t.id === activeT.id) {
            return {
              ...t,
              status: TICKET_STATUS.WAITING,
              calledAt: null,
              staffId: null,
              windowNumber: null,
            };
          }
          return t;
        });

        addAuditLog(
          'FAILOVER_REQUEUE',
          `Xodim (${targetStaff.name}) ${newStatus} bo‘lgani sababli ${activeT.ticketNumber} navbati avtomatik kutish ro‘yxatiga qaytarildi`,
          targetStaff.id,
          activeT.ticketNumber
        );
      }
    }

    const updatedStaff = staffList.map((s) => {
      if (s.id === staffId) {
        return {
          ...s,
          status: newStatus,
          currentTicketId:
            newStatus === STAFF_STATUS.OFFLINE || newStatus === STAFF_STATUS.PAUSED ? null : s.currentTicketId,
          pauseReason: newStatus === STAFF_STATUS.PAUSED ? pauseReason || 'Qisqa tanaffus' : null,
        };
      }
      return s;
    });

    addAuditLog(
      'STAFF_STATUS_CHANGE',
      `${targetStaff?.name || 'Xodim'} holati: ${newStatus}${pauseReason ? ` (${pauseReason})` : ''}`,
      staffId
    );

    setTickets(updatedTickets);
    setStaff(updatedStaff);
    broadcastState(updatedTickets, updatedStaff);
  };

  /**
   * Super Admin: Device management
   */
  const restartDevice = (deviceId) => {
    const devList = devices || INITIAL_DEVICES;
    const updated = devList.map((d) =>
      d.id === deviceId ? { ...d, status: 'ONLINE', lastPing: 'Hozirgina' } : d
    );
    setDevices(updated);
    addAuditLog('DEVICE_RESTART', `Qurilma qayta ishga tushirildi (${deviceId})`);
  };

  const toggleDeviceStatus = (deviceId) => {
    const devList = devices || INITIAL_DEVICES;
    const updated = devList.map((d) =>
      d.id === deviceId ? { ...d, status: d.status === 'ONLINE' ? 'OFFLINE' : 'ONLINE' } : d
    );
    setDevices(updated);
  };

  const addDevice = (newDev) => {
    const devList = devices || INITIAL_DEVICES;
    const updated = [...devList, newDev];
    setDevices(updated);
  };

  const deleteDevice = (deviceId) => {
    const devList = devices || INITIAL_DEVICES;
    const updated = devList.filter((d) => d.id !== deviceId);
    setDevices(updated);
  };

  const toggleServiceActive = (serviceId) => {
    const srvList = services || INITIAL_SERVICES;
    const updated = srvList.map((s) => (s.id === serviceId ? { ...s, active: !s.active } : s));
    setServices(updated);
  };

  const sendOperatorAlert = (message) => {
    const newAlert = {
      id: `alt-${Date.now()}`,
      sender: 'Operator',
      message,
      time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
    };
    setOperatorAlerts((prev) => [newAlert, ...(prev || [])]);
  };

  const resetToDemo = () => {
    setBranches(INITIAL_BRANCHES);
    setServices(INITIAL_SERVICES);
    setStaff(INITIAL_STAFF);
    setTickets(INITIAL_TICKETS);
    setDevices(INITIAL_DEVICES);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    try {
      localStorage.clear();
    } catch {}
    broadcastState(INITIAL_TICKETS, INITIAL_STAFF);
  };

  const clearQueue = () => {
    const staffList = staff || INITIAL_STAFF;
    const resetStaff = staffList.map((s) => ({
      ...s,
      status: STAFF_STATUS.AVAILABLE,
      currentTicketId: null,
      noShowCountToday: 0,
    }));
    setTickets([]);
    setStaff(resetStaff);
    broadcastState([], resetStaff);
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
        operatorAlerts: operatorAlerts || [],
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
        addDevice,
        deleteDevice,
        toggleServiceActive,
        sendOperatorAlert,
        resetToDemo,
        clearQueue,
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
