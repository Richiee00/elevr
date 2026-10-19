export function toCsv<T>(rows: T[], columns: { header: string; value: (r: T) => unknown }[]): string {
  const esc = (v: unknown) => {
    if (v == null) return "";
    let s = String(v);
    if (/^[=+\-@\t\r]/.test(s) && !/^-?\d/.test(s)) s = "'" + s; // CSV-injection guard
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [columns.map((c) => esc(c.header)).join(",")];
  for (const r of rows) lines.push(columns.map((c) => esc(c.value(r))).join(","));
  return lines.join("\n") + "\n";
}

export function csvResponse(body: string, filename: string): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
