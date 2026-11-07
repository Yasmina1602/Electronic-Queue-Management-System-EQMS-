-- ELEKTRON NAVBAT BOSHQARUV TIZIMI (QMS) POSTGRESQL SCHEMA

CREATE TABLE IF NOT EXISTS branches (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS departments (
  id VARCHAR(50) PRIMARY KEY,
  branch_id VARCHAR(50) REFERENCES branches(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(20),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  prefix VARCHAR(10) NOT NULL,
  avg_duration_min INT DEFAULT 10,
  icon VARCHAR(50) DEFAULT 'Layers',
  priority_weight INT DEFAULT 1,
  category VARCHAR(50) DEFAULT 'general',
  active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE services ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 1;

CREATE TABLE IF NOT EXISTS roles (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS employees (
  id VARCHAR(50) PRIMARY KEY,
  branch_id VARCHAR(50) REFERENCES branches(id) ON DELETE SET NULL,
  role_id VARCHAR(50) REFERENCES roles(id) ON DELETE RESTRICT DEFAULT 'OPERATOR',
  name VARCHAR(255) NOT NULL,
  login VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  window_number VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'OFFLINE' CHECK (status IN ('OFFLINE', 'AVAILABLE', 'BUSY', 'PAUSED')),
  pause_reason TEXT,
  current_ticket_id VARCHAR(50),
  served_count_today INT DEFAULT 0,
  no_show_count_today INT DEFAULT 0,
  total_service_minutes INT DEFAULT 0,
  last_service_finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_services (
  employee_id VARCHAR(50) REFERENCES employees(id) ON DELETE CASCADE,
  service_id VARCHAR(50) REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (employee_id, service_id)
);

-- Section 10: Anonymous Customer Loyalty & Referral System
CREATE TABLE IF NOT EXISTS anonymous_customers (
  id VARCHAR(50) PRIMARY KEY,
  customer_code VARCHAR(50) UNIQUE NOT NULL,
  referral_code VARCHAR(50) UNIQUE NOT NULL,
  referred_by_id VARCHAR(50) REFERENCES anonymous_customers(id) ON DELETE SET NULL,
  visits_count INT DEFAULT 0,
  bonus_balance DECIMAL(12, 2) DEFAULT 0.00,
  discount_percent INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_visit_at TIMESTAMPTZ DEFAULT NOW()
);

-- Loyalty discount rules configurable by Superadmin & Admin
CREATE TABLE IF NOT EXISTS loyalty_tiers (
  id VARCHAR(50) PRIMARY KEY,
  min_visits INT NOT NULL UNIQUE,
  discount_percent INT NOT NULL,
  description VARCHAR(255),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_sequences (
  branch_id VARCHAR(50) NOT NULL,
  service_id VARCHAR(50) NOT NULL,
  created_date DATE DEFAULT CURRENT_DATE,
  last_sequence INT DEFAULT 0,
  PRIMARY KEY (branch_id, service_id, created_date)
);

-- Section 4 & 5: Queues Table with strict FIFO and concurrency support
CREATE TABLE IF NOT EXISTS queues (
  id VARCHAR(50) PRIMARY KEY,
  ticket_number VARCHAR(20) NOT NULL,
  branch_id VARCHAR(50) REFERENCES branches(id) ON DELETE CASCADE NOT NULL,
  service_id VARCHAR(50) REFERENCES services(id) ON DELETE RESTRICT NOT NULL,
  anonymous_customer_id VARCHAR(50) REFERENCES anonymous_customers(id) ON DELETE SET NULL,
  referral_code_applied VARCHAR(50),
  discount_percent_applied INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'WAITING' CHECK (status IN ('WAITING', 'CALLED', 'IN_SERVICE', 'COMPLETED', 'NO_SHOW', 'CANCELLED', 'TRANSFERRED')),
  priority VARCHAR(20) DEFAULT 'REGULAR' CHECK (priority IN ('REGULAR', 'VIP')),
  staff_id VARCHAR(50) REFERENCES employees(id) ON DELETE SET NULL,
  window_number VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  called_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  transferred_at TIMESTAMPTZ,
  transferred_from_service_id VARCHAR(50),
  sequence_number INT NOT NULL,
  created_date DATE DEFAULT CURRENT_DATE,
  CONSTRAINT uq_daily_ticket UNIQUE (branch_id, service_id, sequence_number, created_date)
);

CREATE TABLE IF NOT EXISTS queue_history (
  id SERIAL PRIMARY KEY,
  queue_id VARCHAR(50) REFERENCES queues(id) ON DELETE CASCADE,
  old_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  changed_by_staff_id VARCHAR(50) REFERENCES employees(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_bonus_logs (
  id SERIAL PRIMARY KEY,
  customer_id VARCHAR(50) REFERENCES anonymous_customers(id) ON DELETE CASCADE,
  queue_id VARCHAR(50) REFERENCES queues(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  amount DECIMAL(12, 2) DEFAULT 0.00,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS devices (
  id VARCHAR(50) PRIMARY KEY,
  branch_id VARCHAR(50) REFERENCES branches(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  ip_address VARCHAR(50),
  type VARCHAR(30) CHECK (type IN ('KIOSK', 'OPERATOR', 'DISPLAY', 'PRINTER')),
  status VARCHAR(20) DEFAULT 'ONLINE' CHECK (status IN ('ONLINE', 'OFFLINE', 'ERROR')),
  token VARCHAR(255),
  last_ping TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  branch_id VARCHAR(50) REFERENCES branches(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  details TEXT,
  staff_id VARCHAR(50) REFERENCES employees(id) ON DELETE SET NULL,
  ticket_number VARCHAR(50),
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_schedules (
  id SERIAL PRIMARY KEY,
  branch_id VARCHAR(50) REFERENCES branches(id) ON DELETE CASCADE,
  day_of_week INT CHECK (day_of_week BETWEEN 1 AND 7),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_work_day BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_requests (
  id VARCHAR(50) PRIMARY KEY,
  branch_id VARCHAR(50) REFERENCES branches(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  login VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  window_number VARCHAR(20),
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for ultra-fast FIFO selection, locking, and multi-tenant branch isolation
CREATE INDEX IF NOT EXISTS idx_queues_fetch ON queues (branch_id, status, priority, created_at);
CREATE INDEX IF NOT EXISTS idx_queues_staff ON queues (staff_id, status);
CREATE INDEX IF NOT EXISTS idx_queues_date ON queues (created_date, branch_id);
CREATE INDEX IF NOT EXISTS idx_customers_code ON anonymous_customers (customer_code);
CREATE INDEX IF NOT EXISTS idx_customers_referral ON anonymous_customers (referral_code);
CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_logs (created_at DESC);
