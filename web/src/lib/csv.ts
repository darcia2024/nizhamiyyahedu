/** Neutralise spreadsheet formulas when exporting user-controlled text. */
export function csvCell(value: unknown): string {
  let s=String(value??"");
  if (/^[\s]*[=+@-]/.test(s)) s="'"+s;
  return `"${s.replace(/"/g,'""')}"`;
}
export function csvResponse(rows: unknown[][],name:string) {
  return new Response("\uFEFF"+rows.map(r=>r.map(csvCell).join(",")).join("\r\n"),{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="${name}.csv"`,"Cache-Control":"private, no-store"}});
}
