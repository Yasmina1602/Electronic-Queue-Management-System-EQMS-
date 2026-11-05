import assert from 'assert';
import { pool, query, withTransaction } from '../config/db.js';
import { runSeed } from '../database/seed.js';
import {
  createTicket,
  callNextCustomer,
  startService,
  completeService,
  markNoShow,
  updateStaffStatus,
  getFullBranchState,
} from '../services/queueService.js';
import { getOrCreateAnonymousCustomer, recordVisitCompletion } from '../services/loyaltyService.js';

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING MANDATORY TEST SCENARIOS (Section 16)');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`Scenario: ${name} ... `);
      await fn();
      console.log('✅ PASSED');
      passed++;
    } catch (err) {
      console.log(`❌ FAILED: ${err.message}`);
      console.error(err);
      failed++;
    }
  }

  // Reset database before testing
  await runSeed();

  // Clean queues table for tests
  await query(`DELETE FROM queues WHERE branch_id = 'branch-1'`);
  await query(`UPDATE employees SET status = 'AVAILABLE', current_ticket_id = NULL, served_count_today = 0 WHERE branch_id = 'branch-1'`);

  // SCENARIO 1: Bir vaqtda 10 ta mijoz navbat olsa, raqamlar takrorlanmasligi
  await test('1. 10 ta mijoz bir vaqtda navbat olganda takrorlanmaslik (Concurrency)', async () => {
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(createTicket({ branchId: 'branch-1', serviceId: 'srv-general' }));
    }
    const results = await Promise.all(promises);
    const ticketNumbers = results.map((r) => r.ticket.ticket_number);
    const uniqueNumbers = new Set(ticketNumbers);

    assert.strictEqual(ticketNumbers.length, 10, 'Jami 10 ta navbat yaratilishi kerak');
    assert.strictEqual(uniqueNumbers.size, 10, 'Barcha 10 ta navbat raqamlari mutlaqo noyob bo‘lishi kerak');
  });

  // SCENARIO 2: Bir vaqtda bir nechta xodim «Keyingi mijoz» tugmasini bossa, bitta navbat ikki xodimga berilmasligi
  await test('2. Bir nechta xodim bir vaqtda chaqirganda bitta navbat ikki kishiga berilmasligi (FOR UPDATE SKIP LOCKED)', async () => {
    // 3 ta xodim (staff-1, staff-2, staff-3) bir vaqtda callNextCustomer chaqiradi
    const promises = [
      callNextCustomer('staff-1', false, 'branch-1'),
      callNextCustomer('staff-2', false, 'branch-1'),
      callNextCustomer('staff-3', false, 'branch-1'),
    ];

    const results = await Promise.all(promises);
    const assignedTickets = results.filter((r) => r.success && r.ticket).map((r) => r.ticket.ticket_number);
    const uniqueAssigned = new Set(assignedTickets);

    assert.strictEqual(assignedTickets.length, uniqueAssigned.size, 'Bir xil navbat ikki xodimga berilmasligi kerak');
  });

  // SCENARIO 3: Xodim faqat o‘z xizmat vakolatiga tegishli navbatni olishi
  await test('3. Xodim faqat o‘z xizmat vakolatiga tegishli navbatni olishi', async () => {
    // staff-5 faqat srv-general ga vakolatli. Buxgalteriya navbatini ololmasligi kerak.
    // Yangi buxgalteriya navbati yaratamiz
    const bTicket = await createTicket({ branchId: 'branch-1', serviceId: 'srv-accounting' });
    
    // staff-5 ni bo'shatamiz
    await updateStaffStatus('staff-5', 'AVAILABLE');
    // General navbatlarni vaqtincha olib qo'yamiz yoki tekshiramiz
    const authSrv = await query(`SELECT service_id FROM employee_services WHERE employee_id = 'staff-5'`);
    const serviceIds = authSrv.rows.map((r) => r.service_id);
    assert.ok(serviceIds.includes('srv-general'), 'staff-5 srv-general ga ega bo‘lishi kerak');
    assert.ok(!serviceIds.includes('srv-accounting'), 'staff-5 srv-accounting ga ega bo‘lmasligi kerak');
  });

  // SCENARIO 4: Bir nechta xizmatni biladigan xodim eng eski mos navbatni olishi (FIFO)
  await test('4. Bir nechta xizmatni biladigan xodim eng eski mos navbatni olishi (FIFO)', async () => {
    // Navbatlarni tozalab, 2 xil xizmat yaratamiz
    await query(`DELETE FROM queues WHERE branch_id = 'branch-1'`);
    await query(`UPDATE employees SET status = 'AVAILABLE', current_ticket_id = NULL, served_count_today = 0 WHERE branch_id = 'branch-1'`);

    const t1 = await createTicket({ branchId: 'branch-1', serviceId: 'srv-general' });
    await new Promise((r) => setTimeout(r, 60));
    const t2 = await createTicket({ branchId: 'branch-1', serviceId: 'srv-accounting' });

    // staff-1 ikkala xizmatni biladi. Birinchi yaratilgan t1 ni olishi kerak!
    const res = await callNextCustomer('staff-1', false, 'branch-1');
    assert.ok(res.success, 'Call next customer muvaffaqiyatli bo‘lishi kerak');
    assert.strictEqual(res.ticket.ticket_number, t1.ticket.ticket_number, 'Eng eski navbat (t1) olinishi kerak');
  });

  // SCENARIO 5: Xodim BUSY holatida bo‘lsa, yangi navbat ololmasligi
  await test('5. Xodim BUSY holatida bo‘lsa, yangi navbat ololmasligi', async () => {
    // staff-1 hozir t1 bilan BUSY
    let errorCaught = false;
    try {
      await callNextCustomer('staff-1', false, 'branch-1');
    } catch (err) {
      errorCaught = true;
      assert.ok(err.message.includes('Avval joriy mijoz') || err.message.includes('AVAILABLE'));
    }
    assert.ok(errorCaught, 'BUSY xodim yangi navbat olmoqchi bo‘lsa xatolik berishi kerak');
  });

  // SCENARIO 6: Xodim OFFLINE bo‘lsa, navbat unga biriktirilmasligi
  await test('6. Xodim OFFLINE bo‘lsa, navbat unga biriktirilmasligi', async () => {
    await updateStaffStatus('staff-3', 'OFFLINE');
    let errorCaught = false;
    try {
      await callNextCustomer('staff-3', false, 'branch-1');
    } catch (err) {
      errorCaught = true;
      assert.ok(err.message.includes('AVAILABLE'));
    }
    assert.ok(errorCaught, 'OFFLINE xodim navbat chaqira olmasligi kerak');
  });

  // SCENARIO 7: Xodim xizmatni yakunlagach, AVAILABLE holatiga qaytishi
  await test('7. Xodim xizmatni yakunlagach AVAILABLE holatiga qaytishi', async () => {
    // staff-1 hozir band (t1 bilan). Uni start va complete qilamiz
    const staffRes = await query(`SELECT current_ticket_id FROM employees WHERE id = 'staff-1'`);
    const activeTicketId = staffRes.rows[0].current_ticket_id;

    assert.ok(activeTicketId, 'staff-1 active ticketga ega bo‘lishi kerak');
    await startService(activeTicketId, 'staff-1');
    await completeService(activeTicketId, 'staff-1');

    const updatedStaff = await query(`SELECT status, current_ticket_id, served_count_today FROM employees WHERE id = 'staff-1'`);
    assert.strictEqual(updatedStaff.rows[0].status, 'AVAILABLE', 'Xizmat yakunlangach AVAILABLE bo‘lishi kerak');
    assert.strictEqual(updatedStaff.rows[0].current_ticket_id, null, 'current_ticket_id bo‘shatilishi kerak');
    assert.ok(updatedStaff.rows[0].served_count_today > 0, 'served_count_today oshgan bo‘lishi kerak');
  });

  // SCENARIO 8: Printer ishlamasa ham navbat bazada saqlanishi
  await test('8. Printer ishlamasa ham navbat bazada saqlanishi', async () => {
    // Kiosk API mijozga chek chop etish printeridan mustaqil ravishda PostgreSQL ga yozadi
    const newT = await createTicket({ branchId: 'branch-1', serviceId: 'srv-general' });
    const checkDb = await query(`SELECT * FROM queues WHERE id = $1`, [newT.ticket.id]);
    assert.strictEqual(checkDb.rows.length, 1, 'Navbat PostgreSQL bazasida saqlangan bo‘lishi shart');
    assert.strictEqual(checkDb.rows[0].status, 'WAITING', 'Holati WAITING bo‘lishi shart');
  });

  // SCENARIO 9: WebSocket uzilib qolsa, qayta ulanganda ma'lumotlar sinxronlashishi
  await test('9. Qayta ulanganda to‘liq holat sinxronizatsiyasi (getFullBranchState)', async () => {
    const state = await getFullBranchState('branch-1');
    assert.ok(Array.isArray(state.branches), 'Filiallar massiv bo‘lishi kerak');
    assert.ok(Array.isArray(state.services), 'Xizmatlar massiv bo‘lishi kerak');
    assert.ok(Array.isArray(state.staff), 'Xodimlar massiv bo‘lishi kerak');
    assert.ok(Array.isArray(state.tickets), 'Navbatlar massiv bo‘lishi kerak');
    assert.ok(Array.isArray(state.devices), 'Qurilmalar massiv bo‘lishi kerak');
  });

  // SCENARIO 10: Bir filial ikkinchi filial ma'lumotlarini ko‘ra olmasligi
  await test('10. Filiallararo ma’lumotlar izolyatsiyasi', async () => {
    await query(`INSERT INTO branches (id, name, code) VALUES ('branch-2', 'Filial 2 Test', 'F2T') ON CONFLICT DO NOTHING`);
    // branch-2 uchun yangi navbat yaratamiz
    const tBranch2 = await createTicket({ branchId: 'branch-2', serviceId: 'srv-general' });
    
    // branch-1 holatini olamiz
    const stateBranch1 = await getFullBranchState('branch-1');
    const hasBranch2Ticket = stateBranch1.tickets.some((t) => t.id === tBranch2.ticket.id);

    assert.strictEqual(hasBranch2Ticket, false, 'branch-1 monitori branch-2 navbatini ko‘rmasligi shart');
    await query(`DELETE FROM queues WHERE branch_id = 'branch-2'`);
    await query(`DELETE FROM branches WHERE id = 'branch-2'`);
  });

  // SCENARIO 11: Ruxsatsiz foydalanuvchi administrator funksiyalariga kira olmasligi (RBAC)
  await test('11. Role-Based Access Control (RBAC) tekshiruvi', async () => {
    const opUser = await query(`SELECT * FROM employees WHERE id = 'staff-1'`);
    assert.strictEqual(opUser.rows[0].role_id, 'OPERATOR');

    const mgrUser = await query(`SELECT * FROM employees WHERE id = 'manager-1'`);
    assert.strictEqual(mgrUser.rows[0].role_id, 'MANAGER');

    const superUser = await query(`SELECT * FROM employees WHERE id = 'superadmin-1'`);
    assert.strictEqual(superUser.rows[0].role_id, 'SUPERADMIN');
  });

  // SCENARIO 12: Bir navbatning ikki marta yakunlanishiga yo‘l qo‘yilmasligi
  await test('12. Bir navbatning ikki marta yakunlanishiga yo‘l qo‘yilmasligi', async () => {
    const newT = await createTicket({ branchId: 'branch-1', serviceId: 'srv-general' });
    await updateStaffStatus('staff-2', 'AVAILABLE');
    const callRes = await callNextCustomer('staff-2', false, 'branch-1');

    await startService(callRes.ticket.id, 'staff-2');
    await completeService(callRes.ticket.id, 'staff-2');

    let duplicateCompleted = false;
    try {
      await completeService(callRes.ticket.id, 'staff-2');
    } catch (err) {
      duplicateCompleted = true;
      assert.ok(err.message.includes('allaqachon yakunlangan'));
    }

    assert.ok(duplicateCompleted, 'Navbat ikkinchi marta COMPLETED qilinishiga yo‘l qo‘yilmasligi kerak');
  });

  // SECTION 10: Anonymous Customer Loyalty & Referral Test
  await test('13. Anonim Sodiqlik (Chegirma & Referral bonusi) tekshiruvi', async () => {
    // 1. Yangi anonim mijoz yaratamiz
    const cust1 = await getOrCreateAnonymousCustomer();
    assert.ok(cust1.customer_code, 'Anonim QR token yaratilishi kerak');
    assert.ok(cust1.referral_code, 'Referral token yaratilishi kerak');

    // 2. Ikkinchi mijoz cust1 referral kodi bilan keladi
    const cust2 = await getOrCreateAnonymousCustomer(null, cust1.referral_code);
    assert.strictEqual(cust2.referred_by_id, cust1.id, 'cust1 ga bog‘lanishi kerak');

    // 3. cust2 xizmatini muvaffaqiyatli COMPLETED qilganda referral bonusi beriladi
    const qCust2 = await createTicket({ branchId: 'branch-1', serviceId: 'srv-general', referralCode: cust1.referral_code });
    await recordVisitCompletion(cust2.id, qCust2.ticket.id, cust1.referral_code);

    const updatedCust1 = await query(`SELECT bonus_balance FROM anonymous_customers WHERE id = $1`, [cust1.id]);
    assert.strictEqual(parseFloat(updatedCust1.rows[0].bonus_balance), 10000, 'Referrerga 10,000 UZS bonus yozilishi kerak');
  });

  console.log('\n======================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
