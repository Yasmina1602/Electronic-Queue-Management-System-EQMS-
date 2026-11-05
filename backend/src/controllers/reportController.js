import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { query } from '../config/db.js';

export async function getAnalytics(req, res, next) {
  try {
    const branchId = req.query.branchId || 'branch-1';
    const period = req.query.period || 'today'; // 'today', 'week', 'month', 'year', 'all'

    let dateFilter = 'created_date = CURRENT_DATE';
    if (period === 'week') {
      dateFilter = `created_at >= NOW() - INTERVAL '7 days'`;
    } else if (period === 'month') {
      dateFilter = `created_at >= NOW() - INTERVAL '30 days'`;
    } else if (period === 'year') {
      dateFilter = `created_at >= NOW() - INTERVAL '365 days'`;
    } else if (period === 'all') {
      dateFilter = '1=1';
    }

    const [summaryRes, serviceStatsRes, staffStatsRes, hourlyRes, monthlyTrendsRes] = await Promise.all([
      query(`
        SELECT 
          COUNT(*)::int as total_tickets,
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)::int as completed_count,
          COUNT(CASE WHEN status = 'WAITING' THEN 1 END)::int as waiting_count,
          COUNT(CASE WHEN status IN ('CALLED', 'IN_SERVICE') THEN 1 END)::int as in_service_count,
          COUNT(CASE WHEN status = 'NO_SHOW' THEN 1 END)::int as no_show_count,
          COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END)::int as cancelled_count,
          AVG(CASE WHEN called_at IS NOT NULL AND created_at IS NOT NULL 
              THEN EXTRACT(EPOCH FROM (called_at - created_at))/60 END)::numeric(10,1) as avg_wait_min,
          AVG(CASE WHEN completed_at IS NOT NULL AND started_at IS NOT NULL 
              THEN EXTRACT(EPOCH FROM (completed_at - started_at))/60 END)::numeric(10,1) as avg_service_min
        FROM queues
        WHERE branch_id = $1 AND ${dateFilter}
      `, [branchId]),

      query(`
        SELECT s.id, s.name, s.prefix, COUNT(q.id)::int as count,
               COUNT(CASE WHEN q.status = 'COMPLETED' THEN 1 END)::int as completed_count
        FROM services s
        LEFT JOIN queues q ON s.id = q.service_id AND q.branch_id = $1 AND ${dateFilter}
        GROUP BY s.id, s.name, s.prefix
        ORDER BY count DESC
      `, [branchId]),

      query(`
        SELECT e.id, e.name, e.window_number, e.status,
               e.served_count_today, e.no_show_count_today, e.total_service_minutes,
               CASE WHEN e.served_count_today > 0 
                    THEN ROUND(e.total_service_minutes::numeric / e.served_count_today, 1) 
                    ELSE 0 END as avg_minutes_per_client
        FROM employees e
        WHERE e.branch_id = $1
        ORDER BY e.window_number
      `, [branchId]),

      query(`
        SELECT EXTRACT(HOUR FROM created_at)::int as hour, COUNT(*)::int as count
        FROM queues
        WHERE branch_id = $1 AND ${dateFilter}
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY hour
      `, [branchId]),

      // Oylik dinamika: Qaysi oyda mijozlar ko'payadi, qaysi oyda kamayadi
      query(`
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM') as month,
          COUNT(*)::int as total_tickets,
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)::int as completed_tickets,
          AVG(CASE WHEN called_at IS NOT NULL AND created_at IS NOT NULL 
              THEN EXTRACT(EPOCH FROM (called_at - created_at))/60 END)::numeric(10,1) as avg_wait_min
        FROM queues
        WHERE branch_id = $1
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY month DESC
        LIMIT 12
      `, [branchId]),
    ]);

    res.json({
      success: true,
      period,
      summary: summaryRes.rows[0] || {},
      byService: serviceStatsRes.rows,
      byStaff: staffStatsRes.rows,
      hourlyTraffic: hourlyRes.rows,
      monthlyTrends: monthlyTrendsRes.rows,
    });
  } catch (err) {
    next(err);
  }
}

export async function exportExcelReport(req, res, next) {
  try {
    const branchId = req.query.branchId || 'branch-1';
    const ticketsRes = await query(`
      SELECT q.ticket_number, s.name as service_name, q.status, q.priority,
             COALESCE(e.name, 'Kutish zalida') as staff_name,
             COALESCE(q.window_number, '-') as window_number,
             TO_CHAR(q.created_at, 'YYYY-MM-DD HH24:MI:SS') as created_time,
             TO_CHAR(q.called_at, 'YYYY-MM-DD HH24:MI:SS') as called_time,
             TO_CHAR(q.completed_at, 'YYYY-MM-DD HH24:MI:SS') as completed_time,
             CASE WHEN q.called_at IS NOT NULL AND q.created_at IS NOT NULL 
                  THEN ROUND((EXTRACT(EPOCH FROM (q.called_at - q.created_at))/60)::numeric, 1)
                  ELSE 0 END as wait_minutes,
             CASE WHEN q.completed_at IS NOT NULL AND q.started_at IS NOT NULL 
                  THEN ROUND((EXTRACT(EPOCH FROM (q.completed_at - q.started_at))/60)::numeric, 1)
                  ELSE 0 END as service_minutes
      FROM queues q
      JOIN services s ON q.service_id = s.id
      LEFT JOIN employees e ON q.staff_id = e.id
      WHERE q.branch_id = $1
      ORDER BY q.created_at DESC
    `, [branchId]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Elektron Navbat QMS';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Barcha Navbatlar Analitikasi');
    sheet.columns = [
      { header: 'Navbat №', key: 'ticket_number', width: 14 },
      { header: 'Xizmat turi', key: 'service_name', width: 25 },
      { header: 'Holati', key: 'status', width: 16 },
      { header: 'Ustuvorlik', key: 'priority', width: 14 },
      { header: 'Operator', key: 'staff_name', width: 22 },
      { header: 'Oyna', key: 'window_number', width: 10 },
      { header: 'Olingan vaqt', key: 'created_time', width: 22 },
      { header: 'Chaqirilgan', key: 'called_time', width: 22 },
      { header: 'Yakunlangan', key: 'completed_time', width: 22 },
      { header: 'Kutish (daqiqa)', key: 'wait_minutes', width: 16 },
      { header: 'Xizmat (daqiqa)', key: 'service_minutes', width: 16 },
    ];

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF065F46' }, // Dark green
    };

    ticketsRes.rows.forEach((row) => sheet.addRow(row));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="navbatlar_analitikasi.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
}

export async function exportCsvReport(req, res, next) {
  try {
    const branchId = req.query.branchId || 'branch-1';
    const ticketsRes = await query(`
      SELECT q.ticket_number, s.name as service_name, q.status, q.priority,
             COALESCE(e.name, 'Kutish zalida') as staff_name,
             COALESCE(q.window_number, '-') as window_number,
             TO_CHAR(q.created_at, 'YYYY-MM-DD HH24:MI:SS') as created_time,
             TO_CHAR(q.called_at, 'YYYY-MM-DD HH24:MI:SS') as called_time,
             TO_CHAR(q.completed_at, 'YYYY-MM-DD HH24:MI:SS') as completed_time,
             CASE WHEN q.called_at IS NOT NULL AND q.created_at IS NOT NULL 
                  THEN ROUND((EXTRACT(EPOCH FROM (q.called_at - q.created_at))/60)::numeric, 1)
                  ELSE 0 END as wait_minutes,
             CASE WHEN q.completed_at IS NOT NULL AND q.started_at IS NOT NULL 
                  THEN ROUND((EXTRACT(EPOCH FROM (q.completed_at - q.started_at))/60)::numeric, 1)
                  ELSE 0 END as service_minutes
      FROM queues q
      JOIN services s ON q.service_id = s.id
      LEFT JOIN employees e ON q.staff_id = e.id
      WHERE q.branch_id = $1
      ORDER BY q.created_at DESC
    `, [branchId]);

    const header = 'Chipta_Raqami,Xizmat_Turi,Holati,Ustuvorlik,Operator_Xodim,Oyna,Olingan_Vaqt,Chaqirilgan_Vaqt,Yakunlangan_Vaqt,Kutish_Daqiqa,Xizmat_Daqiqa\r\n';
    const rows = ticketsRes.rows.map((r) =>
      `"${r.ticket_number}","${r.service_name}","${r.status}","${r.priority}","${r.staff_name}","${r.window_number}","${r.created_time || ''}","${r.called_time || ''}","${r.completed_time || ''}",${r.wait_minutes || 0},${r.service_minutes || 0}`
    ).join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="navbatlar_analitikasi.csv"');
    res.send('\uFEFF' + header + rows);
  } catch (err) {
    next(err);
  }
}

export async function exportPdfReport(req, res, next) {
  try {
    const branchId = req.query.branchId || 'branch-1';
    const summaryRes = await query(`
      SELECT 
        COUNT(*)::int as total_tickets,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)::int as completed_count,
        COUNT(CASE WHEN status = 'WAITING' THEN 1 END)::int as waiting_count,
        COUNT(CASE WHEN status = 'NO_SHOW' THEN 1 END)::int as no_show_count
      FROM queues
      WHERE branch_id = $1 AND created_date = CURRENT_DATE
    `, [branchId]);

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="navbat_hisoboti.pdf"');

    doc.pipe(res);

    doc.fontSize(20).text('ELEKTRON NAVBAT BOSHQARUV TIZIMI', { align: 'center' });
    doc.fontSize(12).text(`Kunlik Statistika Hisoboti (${new Date().toLocaleDateString('uz-UZ')})`, { align: 'center' });
    doc.moveDown(2);

    const s = summaryRes.rows[0] || {};
    doc.fontSize(14).text(`Jami yaratilgan navbatlar: ${s.total_tickets || 0}`);
    doc.fontSize(14).text(`Xizmat ko‘rsatib yakunlanganlar: ${s.completed_count || 0}`);
    doc.fontSize(14).text(`Hozir kutayotganlar: ${s.waiting_count || 0}`);
    doc.fontSize(14).text(`Kelmadi (NO_SHOW): ${s.no_show_count || 0}`);

    doc.moveDown(2);
    doc.fontSize(10).text('Ushbu hisobot avtomatik ravishda PostgreSQL ma’lumotlar bazasidan shakllantirildi.', { align: 'center' });

    doc.end();
  } catch (err) {
    next(err);
  }
}

