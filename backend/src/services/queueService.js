import { pool, query, withTransaction } from '../config/db.js';
import { emitBranchEvent } from './socketService.js';
import { getOrCreateAnonymousCustomer, recordVisitCompletion } from './loyaltyService.js';

export const QUEUE_STATUS = {
  WAITING: 'WAITING',
  CALLED: 'CALLED',
  IN_SERVICE: 'IN_SERVICE',
  COMPLETED: 'COMPLETED',
  NO_SHOW: 'NO_SHOW',
  CANCELLED: 'CANCELLED',
  TRANSFERRED: 'TRANSFERRED',
};

export const STAFF_STATUS = {
  OFFLINE: 'OFFLINE',
  AVAILABLE: 'AVAILABLE',
  BUSY: 'BUSY',
  PAUSED: 'PAUSED',
};

/**
 * Log action to audit_logs
 */
export async function logAudit(clientOrPool, { branchId, action, details, staffId = null, ticketNumber = null, ipAddress = null }) {
  const runner = clientOrPool || pool;
  await runner.query(
    `INSERT INTO audit_logs (branch_id, action, details, staff_id, ticket_number, ip_address, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
    [branchId, action, details, staffId, ticketNumber, ipAddress]
  );
}

/**
 * Log status change to queue_history
 */
export async function logQueueHistory(client, { queueId, oldStatus, newStatus, staffId = null, reason = null }) {
  await client.query(
    `INSERT INTO queue_history (queue_id, old_status, new_status, changed_by_staff_id, reason, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())`,
    [queueId, oldStatus, newStatus, staffId, reason]
  );
}

/**
 * Create a new ticket atomically with sequence number and anonymous loyalty support
 */
export async function createTicket({ branchId, serviceId, isVip = false, anonymousCode = null, referralCode = null, ipAddress = null }) {
  return await withTransaction(async (client) => {
    // 1. Verify branch & service
    const branchRes = await client.query(`SELECT * FROM branches WHERE id = $1 AND active = true`, [branchId]);
    if (branchRes.rows.length === 0) {
      throw new Error('Filial topilmadi yoki faol emas!');
    }
    const branch = branchRes.rows[0];

    const serviceRes = await client.query(`SELECT * FROM services WHERE id = $1 AND active = true`, [serviceId]);
    if (serviceRes.rows.length === 0) {
      throw new Error('Xizmat turi topilmadi yoki to‘xtatilgan!');
    }
    const service = serviceRes.rows[0];

    // 2. Resolve anonymous customer loyalty (no PII requested)
    const customer = await getOrCreateAnonymousCustomer(anonymousCode, referralCode, client);

    // 3. Generate daily sequential ticket number atomically using daily_sequences
    const seqRes = await client.query(
      `INSERT INTO daily_sequences (branch_id, service_id, created_date, last_sequence)
       VALUES ($1, $2, CURRENT_DATE, 1)
       ON CONFLICT (branch_id, service_id, created_date)
       DO UPDATE SET last_sequence = daily_sequences.last_sequence + 1
       RETURNING last_sequence`,
      [branchId, serviceId]
    );

    const seqNum = seqRes.rows[0].last_sequence;
    const ticketNumber = `${service.prefix}-${seqNum}`;
    const queueId = `tick-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const priority = isVip ? 'VIP' : 'REGULAR';
    const discountPercent = customer.discount_percent || 0;

    const insertRes = await client.query(
      `INSERT INTO queues 
        (id, ticket_number, branch_id, service_id, anonymous_customer_id, referral_code_applied, 
         discount_percent_applied, status, priority, sequence_number, created_at, created_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'WAITING', $8, $9, NOW(), CURRENT_DATE)
       RETURNING *`,
      [queueId, ticketNumber, branchId, serviceId, customer.id, referralCode || null, discountPercent, priority, seqNum]
    );

    const newTicket = insertRes.rows[0];

    // History and audit log
    await logQueueHistory(client, {
      queueId: newTicket.id,
      oldStatus: null,
      newStatus: 'WAITING',
      reason: 'Kioskda navbat yaratildi',
    });

    await logAudit(client, {
      branchId,
      action: 'TICKET_CREATED',
      details: `${ticketNumber} yaratildi (${service.name}) - Anonim ID: ${customer.customer_code}, Chegirma: ${discountPercent}%`,
      ticketNumber,
      ipAddress,
    });

    // Count waiting ahead
    const waitingRes = await client.query(
      `SELECT COUNT(*)::int as count 
       FROM queues 
       WHERE branch_id = $1 AND service_id = $2 AND status = 'WAITING'`,
      [branchId, serviceId]
    );
    const waitingAhead = waitingRes.rows[0]?.count || 0;
    const estWaitTimeMin = Math.max(2, (waitingAhead - 1) * (service.avg_duration_min || 8));

    const responsePayload = {
      ticket: {
        ...newTicket,
        serviceName: service.name,
        branchName: branch.name,
        customerCode: customer.customer_code,
        referralCode: customer.referral_code,
        bonusBalance: customer.bonus_balance,
      },
      service,
      branch,
      waitingAhead: Math.max(0, waitingAhead - 1),
      estWaitTimeMin,
    };

    // Emit real-time event to branch room
    emitBranchEvent(branchId, 'ticket:created', responsePayload);

    return responsePayload;
  });
}

/**
 * Call Next Customer using Strict FIFO & PostgreSQL SELECT ... FOR UPDATE SKIP LOCKED
 * Supports automatic load balancing (round-robin / least loaded)
 */
export async function callNextCustomer(staffId, autoAdvance = false, targetBranchId = null) {
  return await withTransaction(async (client) => {
    // 1. Fetch and lock operator
    const staffRes = await client.query(
      `SELECT * FROM employees WHERE id = $1 FOR UPDATE`,
      [staffId]
    );

    if (staffRes.rows.length === 0) {
      throw new Error('Xodim topilmadi!');
    }
    const operator = staffRes.rows[0];

    // Talab: Mijozlarga faqat operator xodim xizmat ko'rsata oladi, admin va superadmin emas!
    if (operator.role_id !== 'OPERATOR') {
      throw new Error(`Mijozlarga faqat xizmat ko‘rsatuvchi operator xodim xizmat qila oladi! Administrator (${operator.name}) mijoz chaqira olmaydi.`);
    }

    const branchId = targetBranchId || operator.branch_id || 'branch-1';

    // Operator must be AVAILABLE (or BUSY if autoAdvance is permitted)
    if (operator.status === STAFF_STATUS.OFFLINE || operator.status === STAFF_STATUS.PAUSED) {
      if (autoAdvance) {
        await client.query(`UPDATE employees SET status = 'AVAILABLE', pause_reason = NULL WHERE id = $1`, [operator.id]);
        operator.status = 'AVAILABLE';
      } else {
        throw new Error(`Xodim ${operator.status} holatida. Navbat qabul qilish uchun xodim AVAILABLE holatida bo'lishi kerak!`);
      }
    }

    // 2. Fetch operator authorized services
    const authSrvRes = await client.query(
      `SELECT service_id FROM employee_services WHERE employee_id = $1`,
      [operator.id]
    );
    const serviceIds = authSrvRes.rows.map((r) => r.service_id);

    // 3. Find eligible WAITING ticket using SELECT ... FOR UPDATE SKIP LOCKED
    // Priority: VIP first, then FIFO by created_at ASC
    let eligibleTicket = null;

    if (serviceIds.length > 0) {
      const ticketRes = await client.query(
        `SELECT q.*, s.name as service_name, s.prefix as service_prefix
         FROM queues q
         JOIN services s ON q.service_id = s.id
         WHERE q.branch_id = $1 
           AND q.service_id = ANY($2::varchar[])
           AND q.status = 'WAITING'
         ORDER BY 
           CASE WHEN q.priority = 'VIP' THEN 1 ELSE 2 END ASC,
           q.created_at ASC
         LIMIT 1
         FOR UPDATE SKIP LOCKED`,
        [branchId, serviceIds]
      );
      if (ticketRes.rows.length > 0) {
        eligibleTicket = ticketRes.rows[0];
      }
    }

    // Fallback: If no service-specific ticket waiting, pick any waiting ticket in branch
    if (!eligibleTicket) {
      const fallbackRes = await client.query(
        `SELECT q.*, s.name as service_name, s.prefix as service_prefix
         FROM queues q
         JOIN services s ON q.service_id = s.id
         WHERE q.branch_id = $1 AND q.status = 'WAITING'
         ORDER BY 
           CASE WHEN q.priority = 'VIP' THEN 1 ELSE 2 END ASC,
           q.created_at ASC
         LIMIT 1
         FOR UPDATE SKIP LOCKED`,
        [branchId]
      );
      if (fallbackRes.rows.length > 0) {
        eligibleTicket = fallbackRes.rows[0];
      }
    }

    // 4. Check active ticket of this operator
    let completedTicketNumber = null;
    const activeTicketRes = await client.query(
      `SELECT * FROM queues 
       WHERE (id = $1 OR staff_id = $2) AND status IN ('CALLED', 'IN_SERVICE')
       FOR UPDATE`,
      [operator.current_ticket_id, operator.id]
    );

    if (activeTicketRes.rows.length > 0) {
      const activeTicket = activeTicketRes.rows[0];
      if (!autoAdvance) {
        throw new Error(`Avval joriy mijoz (${activeTicket.ticket_number}) xizmatini yakunlang!`);
      }

      // If autoAdvance is true:
      // If there is NO waiting ticket, do not abruptly complete the current ticket
      if (!eligibleTicket) {
        return {
          success: false,
          empty: true,
          message: `Hozirda yangi navbatlar yo‘q. Joriy mijoz (${activeTicket.ticket_number}) xizmatini yakunlash uchun "Xizmatni yakunlash (F4)" tugmasini bosing.`,
        };
      }

      // Complete current active ticket cleanly
      await client.query(
        `UPDATE queues 
         SET status = 'COMPLETED', completed_at = NOW() 
         WHERE id = $1`,
        [activeTicket.id]
      );

      await logQueueHistory(client, {
        queueId: activeTicket.id,
        oldStatus: activeTicket.status,
        newStatus: 'COMPLETED',
        staffId: operator.id,
        reason: 'Keyingi mijozga o‘tish',
      });

      completedTicketNumber = activeTicket.ticket_number;
      await recordVisitCompletion(activeTicket.anonymous_customer_id, activeTicket.id, activeTicket.referral_code_applied, client);
    }

    // If no waiting tickets available at all
    if (!eligibleTicket) {
      return {
        success: false,
        empty: true,
        message: 'Hozirda kutayotgan navbatlar yo‘q.',
      };
    }

    // 5. Assign ticket ALWAYS to THIS calling operator (no peer hijack!)
    const assignedOperator = operator;

    // 6. Assign ticket to selected operator
    await client.query(
      `UPDATE queues 
       SET status = 'CALLED', staff_id = $1, window_number = $2, called_at = NOW() 
       WHERE id = $3`,
      [assignedOperator.id, assignedOperator.window_number, eligibleTicket.id]
    );

    await client.query(
      `UPDATE employees 
       SET status = 'BUSY', current_ticket_id = $1, pause_reason = NULL,
           served_count_today = CASE WHEN $2 = true AND id = $3 THEN served_count_today + 1 ELSE served_count_today END
       WHERE id = $4`,
      [eligibleTicket.id, !!completedTicketNumber, operator.id, assignedOperator.id]
    );

    await logQueueHistory(client, {
      queueId: eligibleTicket.id,
      oldStatus: 'WAITING',
      newStatus: 'CALLED',
      staffId: assignedOperator.id,
      reason: `${assignedOperator.window_number}-oyna chaqirdi`,
    });

    await logAudit(client, {
      branchId,
      action: 'TICKET_CALLED',
      details: `${eligibleTicket.ticket_number} navbati ${assignedOperator.window_number}-oyna (${assignedOperator.name})ga biriktirildi`,
      staffId: assignedOperator.id,
      ticketNumber: eligibleTicket.ticket_number,
    });

    const calledTicket = {
      ...eligibleTicket,
      status: 'CALLED',
      staff_id: assignedOperator.id,
      window_number: assignedOperator.window_number,
      called_at: new Date().toISOString(),
    };

    // Real-time broadcast for big display, sound chime, and operator screens
    emitBranchEvent(branchId, 'ticket:called', {
      ticket: calledTicket,
      operator: {
        id: assignedOperator.id,
        name: assignedOperator.name,
        windowNumber: assignedOperator.window_number,
      },
    });

    return {
      success: true,
      ticket: calledTicket,
      operator: assignedOperator,
      previousCompleted: completedTicketNumber,
      turnSkipped: false,
      message: `${eligibleTicket.ticket_number} chaqirildi (${assignedOperator.window_number}-oyna)`,
    };
  });
}

/**
 * Start customer service (CALLED -> IN_SERVICE)
 */
export async function startService(queueId, staffId) {
  return await withTransaction(async (client) => {
    const res = await client.query(
      `SELECT * FROM queues WHERE id = $1 FOR UPDATE`,
      [queueId]
    );
    if (res.rows.length === 0) throw new Error('Navbat topilmadi!');

    const ticket = res.rows[0];
    if (ticket.status !== 'CALLED') {
      throw new Error(`Xizmatni boshlash uchun navbat CALLED holatida bo‘lishi kerak. Joriy holat: ${ticket.status}`);
    }

    await client.query(
      `UPDATE queues 
       SET status = 'IN_SERVICE', started_at = NOW() 
       WHERE id = $1`,
      [queueId]
    );

    await logQueueHistory(client, {
      queueId,
      oldStatus: 'CALLED',
      newStatus: 'IN_SERVICE',
      staffId,
      reason: 'Operator xizmat ko‘rsatishni boshladi',
    });

    emitBranchEvent(ticket.branch_id, 'ticket:updated', { queueId, status: 'IN_SERVICE' });
    return { success: true, queueId, status: 'IN_SERVICE' };
  });
}

/**
 * Complete customer service (IN_SERVICE -> COMPLETED)
 */
export async function completeService(queueId, staffId) {
  return await withTransaction(async (client) => {
    const res = await client.query(
      `SELECT * FROM queues WHERE id = $1 FOR UPDATE`,
      [queueId]
    );
    if (res.rows.length === 0) throw new Error('Navbat topilmadi!');

    const ticket = res.rows[0];
    if (ticket.status === 'COMPLETED') {
      throw new Error('Ushbu navbat allaqachon yakunlangan!');
    }

    const durationMin = ticket.started_at
      ? Math.max(1, Math.round((Date.now() - new Date(ticket.started_at).getTime()) / 60000))
      : 5;

    await client.query(
      `UPDATE queues 
       SET status = 'COMPLETED', completed_at = NOW() 
       WHERE id = $1`,
      [queueId]
    );

    // Operator becomes AVAILABLE
    await client.query(
      `UPDATE employees 
       SET status = 'AVAILABLE', current_ticket_id = NULL,
           served_count_today = served_count_today + 1,
           last_service_finished_at = NOW(),
           total_service_minutes = total_service_minutes + $1
       WHERE id = $2`,
      [durationMin, ticket.staff_id || staffId]
    );

    await logQueueHistory(client, {
      queueId,
      oldStatus: ticket.status,
      newStatus: 'COMPLETED',
      staffId,
      reason: `Muvaffaqiyatli yakunlandi (${durationMin} daqiqa)`,
    });

    // Record Loyalty rewards
    await recordVisitCompletion(ticket.anonymous_customer_id, ticket.id, ticket.referral_code_applied, client);

    emitBranchEvent(ticket.branch_id, 'ticket:completed', { queueId, ticketNumber: ticket.ticket_number });
    return { success: true, queueId, status: 'COMPLETED', durationMin };
  });
}

/**
 * Mark customer as NO_SHOW
 */
export async function markNoShow(queueId, staffId) {
  return await withTransaction(async (client) => {
    const res = await client.query(
      `SELECT * FROM queues WHERE id = $1 FOR UPDATE`,
      [queueId]
    );
    if (res.rows.length === 0) throw new Error('Navbat topilmadi!');

    const ticket = res.rows[0];

    await client.query(
      `UPDATE queues 
       SET status = 'NO_SHOW', completed_at = NOW() 
       WHERE id = $1`,
      [queueId]
    );

    await client.query(
      `UPDATE employees 
       SET status = 'AVAILABLE', current_ticket_id = NULL,
           no_show_count_today = no_show_count_today + 1,
           last_service_finished_at = NOW()
       WHERE id = $1`,
      [ticket.staff_id || staffId]
    );

    await logQueueHistory(client, {
      queueId,
      oldStatus: ticket.status,
      newStatus: 'NO_SHOW',
      staffId,
      reason: 'Mijoz chaqiruvga kelmadi (NO_SHOW)',
    });

    emitBranchEvent(ticket.branch_id, 'ticket:updated', { queueId, status: 'NO_SHOW' });
    return { success: true, queueId, status: 'NO_SHOW' };
  });
}

/**
 * Recall customer (play chime and display flash again)
 */
export async function recallCustomer(queueId, staffId) {
  const res = await query(
    `SELECT q.*, s.name as service_name, e.name as staff_name, e.window_number as current_window
     FROM queues q
     JOIN services s ON q.service_id = s.id
     LEFT JOIN employees e ON q.staff_id = e.id
     WHERE q.id = $1`,
    [queueId]
  );
  if (res.rows.length === 0) throw new Error('Navbat topilmadi!');

  const ticket = res.rows[0];

  emitBranchEvent(ticket.branch_id, 'ticket:recalled', {
    ticket,
    windowNumber: ticket.current_window || ticket.window_number,
  });

  return { success: true, ticket };
}

/**
 * Transfer ticket to another service
 */
export async function transferTicket(queueId, targetServiceId, staffId) {
  return await withTransaction(async (client) => {
    const res = await client.query(
      `SELECT * FROM queues WHERE id = $1 FOR UPDATE`,
      [queueId]
    );
    if (res.rows.length === 0) throw new Error('Navbat topilmadi!');

    const ticket = res.rows[0];

    await client.query(
      `UPDATE queues 
       SET service_id = $1, status = 'WAITING', staff_id = NULL, 
           window_number = NULL, called_at = NULL, started_at = NULL,
           transferred_at = NOW(), transferred_from_service_id = $2
       WHERE id = $3`,
      [targetServiceId, ticket.service_id, queueId]
    );

    // Operator becomes AVAILABLE
    await client.query(
      `UPDATE employees 
       SET status = 'AVAILABLE', current_ticket_id = NULL, last_service_finished_at = NOW()
       WHERE id = $1`,
      [ticket.staff_id || staffId]
    );

    await logQueueHistory(client, {
      queueId,
      oldStatus: ticket.status,
      newStatus: 'TRANSFERRED',
      staffId,
      reason: `Boshqa xizmatga o‘tkazildi (${targetServiceId})`,
    });

    emitBranchEvent(ticket.branch_id, 'ticket:transferred', { queueId, targetServiceId });
    return { success: true, queueId, targetServiceId };
  });
}

/**
 * Update Staff Status with Failover Requeue Protection
 */
export async function updateStaffStatus(staffId, newStatus, pauseReason = null) {
  return await withTransaction(async (client) => {
    const staffRes = await client.query(`SELECT * FROM employees WHERE id = $1 FOR UPDATE`, [staffId]);
    if (staffRes.rows.length === 0) throw new Error('Xodim topilmadi!');

    const staff = staffRes.rows[0];

    // If operator goes OFFLINE or PAUSED while holding a CALLED ticket, failover requeue to WAITING
    if ((newStatus === STAFF_STATUS.OFFLINE || newStatus === STAFF_STATUS.PAUSED) && staff.current_ticket_id) {
      const activeRes = await client.query(
        `SELECT * FROM queues WHERE id = $1 AND status = 'CALLED' FOR UPDATE`,
        [staff.current_ticket_id]
      );

      if (activeRes.rows.length > 0) {
        const activeT = activeRes.rows[0];
        await client.query(
          `UPDATE queues 
           SET status = 'WAITING', staff_id = NULL, window_number = NULL, called_at = NULL 
           WHERE id = $1`,
          [activeT.id]
        );

        await logQueueHistory(client, {
          queueId: activeT.id,
          oldStatus: 'CALLED',
          newStatus: 'WAITING',
          staffId,
          reason: `Failover: Xodim ${newStatus} bo‘lgani sababli navbat qayta kutish ro‘yxatiga olindi`,
        });

        await logAudit(client, {
          branchId: staff.branch_id,
          action: 'FAILOVER_REQUEUE',
          details: `Xodim (${staff.name}) ${newStatus} bo‘ldi, ${activeT.ticket_number} navbati kutish ro‘yxatiga qaytarildi`,
          staffId,
          ticketNumber: activeT.ticket_number,
        });

        emitBranchEvent(staff.branch_id, 'ticket:requeued', { ticketNumber: activeT.ticket_number });
      }
    }

    await client.query(
      `UPDATE employees 
       SET status = $1::varchar, 
           pause_reason = $2,
           current_ticket_id = CASE WHEN $1::varchar IN ('OFFLINE', 'PAUSED') THEN NULL::varchar ELSE current_ticket_id END,
           updated_at = NOW()
       WHERE id = $3`,
      [newStatus, newStatus === STAFF_STATUS.PAUSED ? pauseReason || 'Tanaffus' : null, staffId]
    );

    emitBranchEvent(staff.branch_id, 'staff:status_changed', { staffId, status: newStatus, pauseReason });
    return { success: true, staffId, status: newStatus };
  });
}

/**
 * Get full real-time snapshot for branch
 */
export async function getFullBranchState(branchId) {
  const resolvedBranchId = branchId || 'branch-1';
  const [branches, services, staff, tickets, devices, auditLogs] = await Promise.all([
    query(`SELECT * FROM branches WHERE active = true ORDER BY name`),
    query(`SELECT * FROM services ORDER BY priority_weight DESC, name`),
    query(`
      SELECT e.*, array_agg(es.service_id) as authorized_service_ids 
      FROM employees e
      LEFT JOIN employee_services es ON e.id = es.employee_id
      WHERE e.branch_id = $1
      GROUP BY e.id
      ORDER BY e.window_number
    `, [resolvedBranchId]),
    query(`
      SELECT q.*, s.name as service_name, s.prefix as service_prefix, e.name as staff_name
      FROM queues q
      JOIN services s ON q.service_id = s.id
      LEFT JOIN employees e ON q.staff_id = e.id
      WHERE q.branch_id = $1 AND q.created_date = CURRENT_DATE
      ORDER BY q.created_at ASC
    `, [resolvedBranchId]),
    query(`SELECT * FROM devices WHERE branch_id = $1 ORDER BY name`, [resolvedBranchId]),
    query(`SELECT * FROM audit_logs WHERE branch_id = $1 ORDER BY created_at DESC LIMIT 50`, [resolvedBranchId]),
  ]);

  return {
    branches: branches.rows,
    services: services.rows,
    staff: staff.rows.map((s) => ({
      ...s,
      branchId: s.branch_id || 'branch-1',
      roleId: s.role_id,
      windowNumber: s.window_number,
      servedCountToday: s.served_count_today || 0,
      noShowCountToday: s.no_show_count_today || 0,
      totalServiceMinutes: s.total_service_minutes || 0,
      currentTicketId: s.current_ticket_id || null,
      pauseReason: s.pause_reason || null,
      authorizedServiceIds: (s.authorized_service_ids || []).filter(Boolean),
    })),
    tickets: tickets.rows.map((t) => ({
      ...t,
      ticketNumber: t.ticket_number,
      branchId: t.branch_id,
      serviceId: t.service_id,
      staffId: t.staff_id,
      windowNumber: t.window_number,
      clientName: t.client_name,
      clientPhone: t.client_phone,
      clientIdentifier: t.client_identifier || t.client_name || 'Mijoz',
      createdAt: t.created_at ? new Date(t.created_at).getTime() : Date.now(),
      calledAt: t.called_at ? new Date(t.called_at).getTime() : null,
      startedAt: t.started_at ? new Date(t.started_at).getTime() : null,
      completedAt: t.completed_at ? new Date(t.completed_at).getTime() : null,
    })),
    devices: devices.rows,
    auditLogs: auditLogs.rows,
  };
}
