import {
  createTicket,
  callNextCustomer,
  startService,
  completeService,
  markNoShow,
  recallCustomer,
  transferTicket,
  getFullBranchState,
} from '../services/queueService.js';

export async function handleCreateTicket(req, res, next) {
  try {
    const { branchId, serviceId, isVip, anonymousCode, referralCode } = req.body;
    if (!branchId || !serviceId) {
      return res.status(400).json({ success: false, error: 'Filial va xizmat turi tanlanishi shart!' });
    }

    const ipAddress = req.ip || req.headers['x-forwarded-for'] || null;
    const result = await createTicket({
      branchId,
      serviceId,
      isVip: !!isVip,
      anonymousCode: anonymousCode || null,
      referralCode: referralCode || null,
      ipAddress,
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function handleCallNext(req, res, next) {
  try {
    const staffId = req.user?.id || req.body.staffId;
    const { autoAdvance, branchId } = req.body;

    if (!staffId) {
      return res.status(400).json({ success: false, error: 'Xodim identifikatori kerak!' });
    }

    const result = await callNextCustomer(staffId, !!autoAdvance, branchId || req.user?.branchId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function handleStartService(req, res, next) {
  try {
    const { id } = req.params;
    const staffId = req.user?.id || req.body.staffId;
    const result = await startService(id, staffId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function handleCompleteService(req, res, next) {
  try {
    const { id } = req.params;
    const staffId = req.user?.id || req.body.staffId;
    const result = await completeService(id, staffId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function handleMarkNoShow(req, res, next) {
  try {
    const { id } = req.params;
    const staffId = req.user?.id || req.body.staffId;
    const result = await markNoShow(id, staffId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function handleRecallCustomer(req, res, next) {
  try {
    const { id } = req.params;
    const staffId = req.user?.id || req.body.staffId;
    const result = await recallCustomer(id, staffId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function handleTransferTicket(req, res, next) {
  try {
    const { id } = req.params;
    const { targetServiceId } = req.body;
    const staffId = req.user?.id || req.body.staffId;

    if (!targetServiceId) {
      return res.status(400).json({ success: false, error: 'O‘tkaziladigan xizmat ID ko‘rsatilmadi!' });
    }

    const result = await transferTicket(id, targetServiceId, staffId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function handleGetState(req, res, next) {
  try {
    const branchId = req.query.branchId || req.user?.branchId || 'branch-1';
    const state = await getFullBranchState(branchId);
    res.json({ success: true, ...state });
  } catch (err) {
    next(err);
  }
}

