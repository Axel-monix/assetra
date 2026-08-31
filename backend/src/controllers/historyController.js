// src/controllers/historyController.js
const pool = require("../config/db");
const { success, error } = require("../../constants/response");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

const PAGE_SIZE = 10;

const TYPE_GROUPS = {
  added: ["add_admin", "add_item"],
  updated: ["edit_item"],
  deactivated: ["deactivate_admin", "deactivate_item"],
};

const NEEDS_REPAIR_STATUS = "needs_repair";
const UNAVAILABLE_STATUS = "unavailable";
const REPAIRED_STATUS = "functional";

const TYPE_LABELS = {
  add_admin: "Penambahan Admin",
  add_item: "Penambahan Barang",
  edit_item: "Perubahan Data Barang",
  deactivate_admin: "Penonaktifan Admin",
  deactivate_item: "Penonaktifan Barang",
};

const ASSET_STATUS_LABELS = {
  functional: "Baik / Berfungsi",
  needs_repair: "Perlu Perbaikan",
  unavailable: "Tidak Tersedia",
};

function buildHistoryFilters(reqQuery) {
  const { type, search, dateFrom, dateTo } = reqQuery;
  const conditions = [];
  const params = [];
  let idx = 1;

  if (type && type !== "all" && TYPE_GROUPS[type]) {
    conditions.push(`history.type = ANY($${idx}::history_type[])`);
    params.push(TYPE_GROUPS[type]);
    idx++;
  }

  if (search && search.trim()) {
    conditions.push(
      `(history.subject_name ILIKE $${idx} OR history.subject_code ILIKE $${idx} OR history.description ILIKE $${idx})`,
    );
    params.push(`%${search.trim()}%`);
    idx++;
  }

  if (dateFrom) {
    conditions.push(`history.created_at >= $${idx}`);
    params.push(`${dateFrom} 00:00:00`);
    idx++;
  }

  if (dateTo) {
    conditions.push(`history.created_at <= $${idx}`);
    params.push(`${dateTo} 23:59:59.999`);
    idx++;
  }

  return { conditions, params, idx };
}

async function listHistory(req, res) {
  try {
    const { type, search, dateFrom, dateTo, cursor } = req.query;
    const { conditions, params, idx } = buildHistoryFilters({
      type,
      search,
      dateFrom,
      dateTo,
    });

    if (cursor) {
      conditions.push(`history.id < $${idx}`);
      params.push(Number(cursor));
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const { rows } = await pool.query(
      `SELECT history.id, history.type, history.subject_name,
              history.subject_code, history.description,
              history.created_at, performer.name AS performed_by_name
         FROM history
         LEFT JOIN users performer ON performer.id = history.performed_by
         ${whereClause}
         ORDER BY history.created_at DESC, history.id DESC
         LIMIT $${idx}`,
      [...params, PAGE_SIZE + 1],
    );

    const hasMore = rows.length > PAGE_SIZE;
    const data = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return success(res, { data, meta: { nextCursor, hasMore } });
  } catch (err) {
    console.error("Error in listHistory:", err);
    return error(res, { message: "Gagal mengambil data riwayat." });
  }
}

function mapRowsForExport(rows) {
  return rows.map((row) => ({
    id: row.id,
    activity: TYPE_LABELS[row.type] || row.type,
    subject_name: row.subject_name || "-",
    subject_code: row.subject_code || "-",
    category_name: row.category_name || "-",
    status_label: row.asset_status
      ? ASSET_STATUS_LABELS[row.asset_status] || row.asset_status
      : "-",
    performed_by_name: row.performed_by_name || "-",
    created_at_label: row.created_at
      ? new Date(row.created_at).toLocaleString("id-ID")
      : "-",
    description: row.description || "",
  }));
}

async function getExportSummary() {
  const [addedResult, needsRepairResult, unavailableResult, repairedResult] =
    await Promise.all([
      pool.query(
        `SELECT COUNT(*)::int AS count FROM history
         WHERE type = 'add_item'
         AND date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)`,
      ),
      pool.query(`SELECT COUNT(*)::int AS count FROM asset WHERE status = $1`, [
        NEEDS_REPAIR_STATUS,
      ]),
      pool.query(`SELECT COUNT(*)::int AS count FROM asset WHERE status = $1`, [
        UNAVAILABLE_STATUS,
      ]),
      pool.query(
        `SELECT COUNT(*)::int AS count FROM status_asset
         WHERE old_status = $1 AND new_status = $2
         AND date_trunc('month', changed_at) = date_trunc('month', CURRENT_DATE)`,
        [NEEDS_REPAIR_STATUS, REPAIRED_STATUS],
      ),
    ]);

  return {
    addedThisMonth: addedResult.rows[0].count,
    needsRepairCount: needsRepairResult.rows[0].count,
    unavailableCount: unavailableResult.rows[0].count,
    repairedThisMonth: repairedResult.rows[0].count,
  };
}

function buildPdfBuffer(rows, summary) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 30,
    });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc
      .fontSize(16)
      .text("Laporan Riwayat Aset - Assetra", { align: "center" });
    doc.moveDown(1);

    const columns = [
      { key: "id", label: "ID", width: 35 },
      { key: "activity", label: "Aktivitas", width: 110 },
      { key: "subject_name", label: "Nama", width: 120 },
      { key: "subject_code", label: "Kode", width: 90 },
      { key: "category_name", label: "Kategori", width: 90 },
      { key: "status_label", label: "Status", width: 90 },
      { key: "performed_by_name", label: "Admin", width: 90 },
      { key: "created_at_label", label: "Tanggal", width: 110 },
    ];

    const startX = doc.page.margins.left;
    let y = doc.y;
    const rowHeight = 22;

    function drawHeader() {
      let x = startX;
      doc.font("Helvetica-Bold").fontSize(9);
      columns.forEach((col) => {
        doc.rect(x, y, col.width, rowHeight).stroke();
        doc.text(col.label, x + 4, y + 6, { width: col.width - 8 });
        x += col.width;
      });
      y += rowHeight;
    }

    drawHeader();
    doc.font("Helvetica").fontSize(8);

    rows.forEach((row) => {
      if (y + rowHeight > doc.page.height - doc.page.margins.bottom - 100) {
        doc.addPage();
        y = doc.page.margins.top;
        drawHeader();
        doc.font("Helvetica").fontSize(8);
      }
      let x = startX;
      columns.forEach((col) => {
        doc.rect(x, y, col.width, rowHeight).stroke();
        doc.text(String(row[col.key] ?? "-"), x + 4, y + 6, {
          width: col.width - 8,
          height: rowHeight - 8,
          ellipsis: true,
        });
        x += col.width;
      });
      y += rowHeight;
    });

    y += 20;
    if (y > doc.page.height - doc.page.margins.bottom - 100) {
      doc.addPage();
      y = doc.page.margins.top;
    }
    doc.font("Helvetica-Bold").fontSize(11).text("Ringkasan", startX, y);
    y += 20;
    doc.font("Helvetica").fontSize(9);
    [
      `Barang ditambahkan bulan ini: ${summary.addedThisMonth}`,
      `Barang perlu perbaikan: ${summary.needsRepairCount}`,
      `Barang tidak tersedia: ${summary.unavailableCount}`,
      `Barang selesai diperbaiki bulan ini: ${summary.repairedThisMonth}`,
    ].forEach((line) => {
      doc.text(line, startX, y);
      y += 16;
    });

    doc.end();
  });
}

async function buildExcelBuffer(rows, summary) {
  const workbook = new ExcelJS.Workbook();
   const sheet = workbook.addWorksheet("Riwayat");

  sheet.columns = [
    { header: "ID", key: "id", width: 8 },
    { header: "Aktivitas", key: "activity", width: 26 },
    { header: "Nama", key: "subject_name", width: 24 },
    { header: "Kode", key: "subject_code", width: 16 },
    { header: "Kategori", key: "category_name", width: 18 },
    { header: "Status", key: "status_label", width: 18 },
    { header: "Admin", key: "performed_by_name", width: 18 },
    { header: "Tanggal", key: "created_at_label", width: 22 },
    { header: "Deskripsi", key: "description", width: 30 },
  ];

  sheet.getRow(1).font = { bold: true };
  sheet.addRows(rows);

  sheet.addRow([]);
  sheet.addRow(["Ringkasan"]).font = { bold: true };
  sheet.addRow(["Barang ditambahkan bulan ini", summary.addedThisMonth]);
  sheet.addRow(["Barang perlu perbaikan", summary.needsRepairCount]);
  sheet.addRow(["Barang tidak tersedia", summary.unavailableCount]);
  sheet.addRow([
    "Barang selesai diperbaiki bulan ini",
    summary.repairedThisMonth,
  ]);

  return workbook.xlsx.writeBuffer();
}

async function exportHistory(req, res) {
  try {
    const { type, search, dateFrom, dateTo } = req.query;
    const format = (req.query.format || "excel").toLowerCase();
    const { conditions, params } = buildHistoryFilters({
      type,
      search,
      dateFrom,
      dateTo,
    });

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    const { rows } = await pool.query(
      `SELECT history.id, history.type, history.subject_name,
              history.subject_code, history.description,
              history.created_at, performer.name AS performed_by_name,
              category.category_name AS category_name, asset.status AS asset_status
         FROM history
         LEFT JOIN users performer ON performer.id = history.performed_by
         LEFT JOIN asset ON asset.id = history.id_asset
         LEFT JOIN category ON category.id = asset.id_category
         ${whereClause}
         ORDER BY history.created_at DESC, history.id DESC`,
      params,
    );

    const exportRows = mapRowsForExport(rows);
    const summary = await getExportSummary();

    if (format === "pdf") {
      const buffer = await buildPdfBuffer(exportRows, summary);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="history.pdf"',
      );
      return res.status(200).send(buffer);
    }

    const buffer = await buildExcelBuffer(exportRows, summary);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="history-export.xlsx"',
    );
    return res.status(200).send(buffer);
  } catch (err) {
    console.error("Error in exportHistory:", err);
    return error(res, {
      message: "Gagal mengekspor data riwayat.",
      statusCode: 500,
    });
  }
}

module.exports = { listHistory, exportHistory };
