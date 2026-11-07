import bcrypt from 'bcryptjs';
import { pool, query } from '../config/db.js';
import { runMigration } from './migrate.js';

export async function runSeed() {
  console.log('--- Running Database Seeder ---');
  await runMigration();

  // Clear any existing queues and test tickets
  await query(`TRUNCATE TABLE queues, queue_history, customer_bonus_logs, anonymous_customers, daily_sequences CASCADE;`);

  const passwordHash = await bcrypt.hash('123', 10);
  const adminPasswordHash = await bcrypt.hash('admin123', 10);

  // 1. Roles (Talab: Administrator roli o'chirildi, Filial Menejeri admin bo'ldi)
  await query(`DELETE FROM employees WHERE role_id = 'ADMIN';`);
  await query(`DELETE FROM roles WHERE id = 'ADMIN';`);
  await query(`
    INSERT INTO roles (id, name, description) VALUES
      ('SUPERADMIN', 'Bosh Administrator (Superadmin)', 'Butun tizimni to‘liq boshqarish, barcha filial menejeri va xodimlar sahifalari, login/parollarni boshqarish'),
      ('MANAGER', 'Filial Menejeri (Admin)', 'Filial boshqaruvi, xodimlar monitoringi, admin va menejer boshqaruv panellari'),
      ('OPERATOR', 'Xizmat Ko‘rsatuvchi Operator', 'Mijozlarga xizmat ko‘rsatish va navbatlarni qabul qilish')
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;
  `);

  // 2. Branches (Faqat 1 ta yagona asosiy filial)
  await query(`DELETE FROM branches WHERE id != 'branch-1';`);
  await query(`
    INSERT INTO branches (id, name, code, address, phone, active) VALUES
      ('branch-1', 'Markaziy Bosh Filial', 'MBF', 'Amir Temur shoh ko‘chasi, 1-uy', '+998 71 200-00-00', true)
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code, address = EXCLUDED.address, phone = EXCLUDED.phone, active = EXCLUDED.active;
  `);

  // 3. Departments
  await query(`
    INSERT INTO departments (id, branch_id, name, code, active) VALUES
      ('dep-1', 'branch-1', 'Chakana xizmatlar bo‘limi', 'DEP-CHAKANA', true),
      ('dep-2', 'branch-1', 'Buxgalteriya va hisob-kitoblar', 'DEP-BUX', true)
    ON CONFLICT (id) DO NOTHING;
  `);

  // 4. Services
  await query(`
    INSERT INTO services (id, name, description, prefix, avg_duration_min, icon, priority_weight, category, active, display_order) VALUES
      ('srv-accounting', 'Buxgalteriya', 'Hisob-kitoblar, Soliq, To‘lov topshiriqlari va yuridik shaxslar', 'B', 12, 'Calculator', 2, 'accounting', true, 1),
      ('srv-general', 'Xizmatlar', 'Kassa, Kreditlar, Omonatlar, Kartalar va ma’lumotlar', 'X', 8, 'Layers', 1, 'general', true, 2)
    ON CONFLICT (id) DO UPDATE SET 
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      prefix = EXCLUDED.prefix,
      avg_duration_min = EXCLUDED.avg_duration_min,
      priority_weight = EXCLUDED.priority_weight,
      category = EXCLUDED.category,
      active = EXCLUDED.active,
      display_order = COALESCE(services.display_order, EXCLUDED.display_order);
  `);

  // 4.1. Sodiqlik Chegirma Darajalari (Superadmin va Admin sozlay oladi)
  await query(`
    INSERT INTO loyalty_tiers (id, min_visits, discount_percent, description, active) VALUES
      ('tier-3', 3, 5, 'Doimiy mijoz (3-tashrif)', true),
      ('tier-5', 5, 10, 'Kumush mijoz (5-tashrif)', true),
      ('tier-10', 10, 15, 'Oltin mijoz (10-tashrif)', true)
    ON CONFLICT (id) DO UPDATE SET
      min_visits = EXCLUDED.min_visits,
      discount_percent = EXCLUDED.discount_percent,
      description = EXCLUDED.description,
      active = EXCLUDED.active;
  `);

  // 5. Employees
  await query(`
    INSERT INTO employees (id, branch_id, role_id, name, login, password_hash, phone, window_number, status, served_count_today, no_show_count_today, total_service_minutes) VALUES
      ('superadmin-1', 'branch-1', 'SUPERADMIN', 'Bosh Administrator', 'superadmin', '${adminPasswordHash}', '100', 'SUPER', 'AVAILABLE', 0, 0, 0),
      ('manager-1', 'branch-1', 'MANAGER', 'Filial Menejeri (Admin)', 'manager', '${passwordHash}', '200', 'MGR', 'AVAILABLE', 0, 0, 0),
      ('staff-1', 'branch-1', 'OPERATOR', 'Sanjarbek Aliyev', 'OP-101', '${passwordHash}', '214', '1', 'AVAILABLE', 0, 0, 0),
      ('staff-2', 'branch-1', 'OPERATOR', 'Madina Karimova', 'OP-102', '${passwordHash}', '119', '2', 'AVAILABLE', 0, 0, 0),
      ('staff-3', 'branch-1', 'OPERATOR', 'Jasur Rahimov', 'OP-103', '${passwordHash}', '103', '3', 'AVAILABLE', 0, 0, 0),
      ('staff-4', 'branch-1', 'OPERATOR', 'Nodira Umarova', 'OP-104', '${passwordHash}', '104', '4', 'AVAILABLE', 0, 0, 0),
      ('staff-5', 'branch-1', 'OPERATOR', 'Sardor Ahmedov', 'OP-105', '${passwordHash}', '105', '5', 'AVAILABLE', 0, 0, 0)
    ON CONFLICT (id) DO UPDATE SET 
      name = EXCLUDED.name,
      login = EXCLUDED.login,
      password_hash = EXCLUDED.password_hash,
      role_id = EXCLUDED.role_id,
      phone = EXCLUDED.phone,
      window_number = EXCLUDED.window_number,
      status = EXCLUDED.status;
  `);

  // 6. Employee Services
  await query(`
    INSERT INTO employee_services (employee_id, service_id) VALUES
      ('staff-1', 'srv-general'),
      ('staff-1', 'srv-accounting'),
      ('staff-2', 'srv-general'),
      ('staff-2', 'srv-accounting'),
      ('staff-3', 'srv-general'),
      ('staff-3', 'srv-accounting'),
      ('staff-4', 'srv-accounting'),
      ('staff-5', 'srv-general')
    ON CONFLICT (employee_id, service_id) DO NOTHING;
  `);

  // 7. Devices
  await query(`
    INSERT INTO devices (id, branch_id, name, ip_address, type, status, last_ping) VALUES
      ('dev-1', 'branch-1', 'Kiosk-01', '192.168.1.1', 'KIOSK', 'ONLINE', NOW()),
      ('dev-2', 'branch-1', 'Counter-02', '192.168.1.24', 'OPERATOR', 'ONLINE', NOW()),
      ('dev-3', 'branch-1', 'Counter-03', '192.168.1.2', 'OPERATOR', 'OFFLINE', NOW() - INTERVAL '20 hours'),
      ('dev-4', 'branch-1', 'Tablo-TV-01', '192.168.1.55', 'DISPLAY', 'ONLINE', NOW()),
      ('dev-5', 'branch-1', 'Xprinter-XP80', '192.168.1.80', 'PRINTER', 'ONLINE', NOW())
    ON CONFLICT (id) DO UPDATE SET 
      name = EXCLUDED.name,
      ip_address = EXCLUDED.ip_address,
      type = EXCLUDED.type,
      status = EXCLUDED.status,
      last_ping = EXCLUDED.last_ping;
  `);

  // 8. System Settings
  await query(`
    INSERT INTO system_settings (key, value, description) VALUES
      ('routing_mode', '{"mode": "fair_distribution", "fifo": true}'::jsonb, 'Navbatlarni xodimlar orasida teng taqsimlash va FIFO sozlamalari'),
      ('loyalty_rules', '{"tiers": [{"visits": 3, "discount": 5}, {"visits": 5, "discount": 10}, {"visits": 10, "discount": 15}], "referral_bonus": 10000, "max_discount": 25}'::jsonb, 'Sodiqlik va referral bonus sozlamalari'),
      ('hotkeys', '{"call_next": "F2"}'::jsonb, 'Global tezkor tugmalar sozlamalari')
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
  `);

  // 9. Initial Audit Log
  await query(`
    INSERT INTO audit_logs (branch_id, action, details, staff_id, ticket_number, created_at) VALUES
      ('branch-1', 'SYSTEM_INITIALIZED', 'Tizim ma’lumotlar bazasi va dastlabki sozlamalar muvaffaqiyatli ishga tushirildi', 'superadmin-1', NULL, NOW());
  `);

  console.log('✓ Seeding completed successfully.');
}

if (process.argv[1] === import.meta.url || process.argv[1].endsWith('seed.js')) {
  runSeed()
    .then(() => {
      console.log('Seeder finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

