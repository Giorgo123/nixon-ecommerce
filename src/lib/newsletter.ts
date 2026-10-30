export function normalizeSubscriberEmail(email: string): string {
  return email.trim().toLowerCase();
}

function escapeCsv(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatCsvDate(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

export function buildSubscribersCsv(rows: Array<{ email: string; createdAt: Date | string }>): string {
  const lines = rows.map(
    (row) => `${escapeCsv(row.email)},${escapeCsv(formatCsvDate(row.createdAt))}`
  );

  return ["email,fecha_alta", ...lines].join("\r\n");
}
