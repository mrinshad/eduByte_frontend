/**
 * RFC 4180 Compliant CSV Export Utility
 * Handles proper quotation escaping, UTF-8 BOM encoding for Microsoft Excel,
 * and automatic client-side file download.
 */

export interface CsvColumn<T> {
  header: string;
  accessor: (row: T, index: number) => string | number | boolean | null | undefined;
}

export interface ExportToCsvOptions<T> {
  filename: string;
  columns: CsvColumn<T>[];
  data: T[];
}

/**
 * Escapes a field according to RFC 4180:
 * - If value contains comma, double-quote, or newline, enclose in double quotes.
 * - Any double quote within the field is escaped as two double quotes ("").
 */
function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }

  const str = String(value);

  // Check if string contains characters requiring quotes
  if (str.includes(",") || str.includes("\"") || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, "\"\"")}"`;
  }

  return str;
}

/**
 * Formats data into an RFC 4180 CSV string with UTF-8 BOM and triggers browser download.
 *
 * @returns boolean indicating if the download was initiated
 */
export function exportToCsv<T>({ filename, columns, data }: ExportToCsvOptions<T>): boolean {
  if (!data || data.length === 0) {
    return false;
  }

  // 1. Build Header Row
  const headerRow = columns.map((col) => escapeCsvCell(col.header)).join(",");

  // 2. Build Data Rows
  const dataRows = data.map((row, index) => {
    return columns
      .map((col) => {
        const val = col.accessor(row, index);
        return escapeCsvCell(val);
      })
      .join(",");
  });

  // 3. Combine with newlines
  const csvContent = [headerRow, ...dataRows].join("\r\n");

  // 4. Prepend UTF-8 Byte Order Mark (\uFEFF) for Excel compatibility
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  // 5. Generate Safe Timestamped Filename
  const dateStr = new Date().toISOString().split("T")[0];
  const cleanBase = filename.replace(/\.csv$/i, "").replace(/[^a-zA-Z0-9_\-]/g, "_");
  const fullFilename = `${cleanBase}_${dateStr}.csv`;

  // 6. Trigger Browser Download
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fullFilename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return true;
}
