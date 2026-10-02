/**
 * Universal CSV & Excel Exporter & Importer with UTF-8 BOM support for Microsoft Excel
 */

function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function downloadCSV(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][]
): boolean {
  try {
    const csvContent = [
      headers.map(escapeCsvCell).join(','),
      ...rows.map(row => row.map(escapeCsvCell).join(','))
    ].join('\r\n');

    // Add UTF-8 BOM (\uFEFF) so Excel correctly recognizes UTF-8 (Hindi text, rupee symbol, etc.)
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const safeFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    link.setAttribute('download', safeFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('Failed to export CSV:', err);
    return false;
  }
}

export function downloadTemplate(
  filename: string,
  headers: string[],
  sampleRows: (string | number | null | undefined)[][] = []
): boolean {
  const safeFilename = filename.toLowerCase().includes('template')
    ? filename
    : `${filename}_Template`;
  return downloadCSV(safeFilename, headers, sampleRows);
}

/**
 * Robust RFC-compliant CSV parser that handles quoted multiline strings, escaped quotes, and commas
 */
export function parseCSV(csvText: string): { headers: string[]; rows: string[][] } {
  if (!csvText) return { headers: [], rows: [] };

  // Remove UTF-8 BOM if present
  const clean = csvText.replace(/^\uFEFF/, '');
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    const nextCh = clean[i + 1];

    if (ch === '"') {
      if (inQuotes && nextCh === '"') {
        currentLine += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((ch === '\r' || ch === '\n') && !inQuotes) {
      if (ch === '\r' && nextCh === '\n') {
        i++;
      }
      if (currentLine.trim().length > 0) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else {
      currentLine += ch;
    }
  }

  if (currentLine.trim().length > 0) {
    lines.push(currentLine);
  }

  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const cells: string[] = [];
    let cur = '';
    let inQ = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      const nextCh = line[i + 1];

      if (ch === '"') {
        if (inQ && nextCh === '"') {
          cur += '"';
          i++;
        } else {
          inQ = !inQ;
        }
      } else if (ch === ',' && !inQ) {
        cells.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    cells.push(cur.trim());
    return cells;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}
