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

const STORAGE_KEY = 'qms_storage_v5';
const CHANNEL_NAME = 'qms_broadcast_v5';

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
  const [services, setServices] = useState(() => {
    const saved = getSafeArray(STORAGE_KEY + '_services', INITIAL_SERVICES);
    const existingIds = new Set(saved.map((s) => s.id));
    const missing = INITIAL_SERVICES.filter((s) => !existingIds.has(s.id));
    if (missing.length > 0) {
      return [...saved, ...missing];
    }
    return saved;
  });
  const [staff, setStaff] = useState(() => {
    const saved = getSafeArray(STORAGE_KEY + '_staff', INITIAL_STAFF);
    return saved.map((s) => {
      const initialMatch = INITIAL_STAFF.find((is) => is.id === s.id);
      if (initialMatch && initialMatch.authorizedServiceIds) {
        const set = new Set([...(s.authorizedServiceIds || []), ...initialMatch.authorizedServiceIds]);
        return { ...s, authorizedServiceIds: Array.from(set) };
      }
      return s;
    });
  });
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
      (t) => t.branchId === activeBranchId && t.ticketNumber && t.ticketNumber.startsWith(`${prefix}-`)
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
  const callNextCustomer = (staffId, autoAdvance = false) => {
    let staffList = staff || INITIAL_STAFF;
    let ticketList = tickets || [];

    const operator = staffList.find((s) => s.id === staffId) || staffList[0];
    if (!operator) return { success: false, error: 'Xodim topilmadi!' };

    // Auto-unpause if paused and autoAdvance is requested
    let isPaused = operator.status === STAFF_STATUS.PAUSED;

    // Check if operator already has an active ticket
    const activeTicket = ticketList.find(
      (t) =>
        t.id === operator.currentTicketId ||
        (t.staffId === operator.id && (t.status === TICKET_STATUS.CALLED || t.status === TICKET_STATUS.IN_SERVICE))
    );

    let completedTicketNumber = null;
    if (activeTicket) {
      if (autoAdvance) {
        // Complete current active ticket automatically to advance to the next
        const durationMin = activeTicket.startedAt
          ? Math.max(1, Math.round((Date.now() - activeTicket.startedAt) / 60000))
          : 5;
        completedTicketNumber = activeTicket.ticketNumber;
        ticketList = ticketList.map((t) =>
          t.id === activeTicket.id
            ? { ...t, status: TICKET_STATUS.COMPLETED, completedAt: Date.now() }
            : t
        );
        addAuditLog(
          'TICKET_COMPLETED',
          `${activeTicket.ticketNumber} xizmati yakunlandi (avtomatik keyingisiga o‘tildi)`,
          operator.id,
          activeTicket.ticketNumber
        );
      } else {
        return {
          success: false,
          error: `Avval joriy mijoz (${activeTicket.ticketNumber}) xizmatini yakunlang!`,
        };
      }
    } else if (operator.status !== STAFF_STATUS.AVAILABLE && !autoAdvance) {
      return {
        success: false,
        error: `Mijoz chaqirish uchun xodim "AVAILABLE" (Bo‘sh) holatida bo‘lishi kerak. Joriy holat: ${operator.status}`,
      };
    }

    // Find eligible tickets for this operator
    let eligibleTickets = ticketList.filter(
      (t) =>
        t.status === TICKET_STATUS.WAITING &&
        t.branchId === operator.branchId &&
        (!operator.authorizedServiceIds ||
          operator.authorizedServiceIds.length === 0 ||
          operator.authorizedServiceIds.includes(t.serviceId))
    );

    // Fallback: if no service-specific ticket, pick any waiting ticket in this branch
    if (eligibleTickets.length === 0) {
      eligibleTickets = ticketList.filter(
        (t) => t.status === TICKET_STATUS.WAITING && t.branchId === operator.branchId
      );
    }

    if (eligibleTickets.length === 0) {
      // If we finished an active ticket above, make sure the completed state is saved
      if (activeTicket && autoAdvance) {
        const updatedStaff = staffList.map((s) =>
          s.id === operator.id
            ? {
                ...s,
                status: STAFF_STATUS.AVAILABLE,
                currentTicketId: null,
                servedCountToday: (s.servedCountToday || 0) + 1,
                lastServiceFinishedAt: Date.now(),
              }
            : s
        );
        setTickets(ticketList);
        setStaff(updatedStaff);
        broadcastState(ticketList, updatedStaff);
        return {
          success: true,
          previousCompleted: completedTicketNumber,
          empty: true,
          message: `${completedTicketNumber} yakunlandi. Navbatda boshqa mijoz yo‘q.`,
        };
      }
      return {
        success: false,
        empty: true,
        message: 'Hozirda kutayotgan navbatlar yo‘q.',
      };
    }

    // Sort: VIP first, then FIFO by createdAt
    eligibleTickets.sort((a, b) => {
      if (a.priority === TICKET_PRIORITY.VIP && b.priority !== TICKET_PRIORITY.VIP) return -1;
      if (b.priority === TICKET_PRIORITY.VIP && a.priority !== TICKET_PRIORITY.VIP) return 1;
      return a.createdAt - b.createdAt;
    });

    const selectedTicket = eligibleTickets[0];

    // Talab 3: Xodimlarga xizmatlar teng taqsimlansin, agar qaysidir o'zidan oldingidan 1ta ko'p olib qo'ygan bo'lsa keyingi aylanada galini o'tkazib yuborsin
    const availablePeers = staffList.filter(
      (s) =>
        s.id !== operator.id &&
        s.status === STAFF_STATUS.AVAILABLE &&
        s.branchId === operator.branchId &&
        (!s.authorizedServiceIds || s.authorizedServiceIds.length === 0 || s.authorizedServiceIds.includes(selectedTicket.serviceId))
    );

    let assignedOperator = operator;
    let turnSkipped = false;

    if (availablePeers.length > 0) {
      const minPeerServed = Math.min(...availablePeers.map((p) => p.servedCountToday || 0));
      // Agar ushbu operator bo'sh hamkasbidan 1 ta yoki undan ko'p mijoz olgan bo'lsa, navbat kam olgan hamkasbiga beriladi!
      if ((operator.servedCountToday || 0) > minPeerServed) {
        const leastLoaded = availablePeers.find((p) => (p.servedCountToday || 0) === minPeerServed);
        if (leastLoaded) {
          assignedOperator = leastLoaded;
          turnSkipped = true;
        }
      }
    }

    const updatedTickets = ticketList.map((t) => {
      if (t.id === selectedTicket.id) {
        return {
          ...t,
          status: TICKET_STATUS.CALLED,
          calledAt: Date.now(),
          staffId: assignedOperator.id,
          windowNumber: assignedOperator.windowNumber,
        };
      }
      return t;
    });

    const updatedStaff = staffList.map((s) => {
      if (s.id === assignedOperator.id) {
        return {
          ...s,
          status: STAFF_STATUS.BUSY,
          currentTicketId: selectedTicket.id,
          pauseReason: null,
          servedCountToday: activeTicket && assignedOperator.id === operator.id
            ? (s.servedCountToday || 0) + 1
            : (s.servedCountToday || 0),
        };
      }
      return s;
    });

    const serviceObj = (services || []).find((srv) => srv.id === selectedTicket.serviceId);
    const calledDetails = {
      ...selectedTicket,
      status: TICKET_STATUS.CALLED,
      calledAt: Date.now(),
      staffId: assignedOperator.id,
      windowNumber: assignedOperator.windowNumber,
      serviceName: serviceObj?.name || 'Xizmat',
    };

    const updatedLogs = addAuditLog(
      'TICKET_CALLED',
      `${selectedTicket.ticketNumber} navbati ${assignedOperator.windowNumber}-oyna (${assignedOperator.name}) tomonidan qabul qilindi${turnSkipped ? ' (Teng taqsimlash qoidasi bo‘yicha gal o‘tkazildi)' : ''}`,
      assignedOperator.id,
      selectedTicket.ticketNumber
    );

    setTickets(updatedTickets);
    setStaff(updatedStaff);
    setLastCalledTicket(calledDetails);

    broadcastState(updatedTickets, updatedStaff, calledDetails, updatedLogs);

    if (audioEnabled) playChime();
    if (speechEnabled) {
      announceTicket(selectedTicket.ticketNumber, assignedOperator.windowNumber);
    }

    return {
      success: true,
      ticket: calledDetails,
      previousCompleted: completedTicketNumber,
      operator: assignedOperator,
      turnSkipped,
      message: turnSkipped
        ? `Teng taqsimlash: Navbat kamroq mijoz olgan ${assignedOperator.name} (${assignedOperator.windowNumber}-oyna)ga berildi!`
        : null,
    };
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

  const addStaff = (staffData) => {
    const staffList = staff || INITIAL_STAFF;
    const nextWin = staffData.windowNumber || `${staffList.length + 1}`;
    const newStaffMember = {
      id: `staff-${Date.now()}`,
      name: staffData.name || 'Yangi Xodim',
      login: staffData.login || `OP-${100 + staffList.length + 1}`,
      windowNumber: nextWin,
      branchId: staffData.branchId || activeBranchId || 'branch-1',
      authorizedServiceIds: staffData.authorizedServiceIds || ['srv-general', 'srv-accounting'],
      status: STAFF_STATUS.AVAILABLE,
      currentTicketId: null,
      pauseReason: null,
      servedCountToday: 0,
      noShowCountToday: 0,
      lastServiceFinishedAt: null,
      totalServiceMinutes: 0,
    };
    const updatedStaff = [...staffList, newStaffMember];
    setStaff(updatedStaff);
    broadcastState(tickets, updatedStaff);
    addAuditLog(
      'STAFF_ADDED',
      `Yangi xodim qo‘shildi: ${newStaffMember.name} (${newStaffMember.windowNumber}-oyna)`,
      newStaffMember.id
    );
    return { success: true, staff: newStaffMember };
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
        addStaff,
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
