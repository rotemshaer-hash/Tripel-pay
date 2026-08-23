/**
 * CSV export for the work journal.
 *
 * The point of keeping a journal is being able to hand it to somebody — a client
 * asking what was done on site, a bookkeeper, an auditor. Excel is where that
 * conversation happens, so the file has to open cleanly there.
 */

/** RFC 4180 quoting: wrap in quotes and double any quote inside. */
function cell(value: string | number | undefined): string {
  const text = value === undefined || value === null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(headers: string[], rows: (string | number | undefined)[][]): string {
  return [headers, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
}

/**
 * Hands the browser a CSV file to save.
 *
 * The leading BOM is not decoration: without it Excel on Windows reads the file as
 * the local codepage and every Hebrew character turns to mojibake — the single most common
 * way an otherwise correct export arrives unreadable.
 */
export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([`﻿${content}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
