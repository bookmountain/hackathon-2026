// DD/MM/YYYY date typing for the forms (the design's AU date mask)

/** Keeps digits only (max 8) and inserts the slashes: "14102026" → "14/10/2026" */
export function maskAuDate(text: string): string {
  const d = text.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/** A real calendar date from "DD/MM/YYYY" (local midnight), or null */
export function parseAuDate(text: string): Date | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text.trim());
  if (!m) return null;
  const [day, month, year] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(year, month - 1, day);
  // Rejects 31/02 etc., which Date would roll into the next month
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

export function formatAuDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** "18:30" → that time on `date`; blank means 6pm, like the design */
export function atTime(date: Date, time: string): Date | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time.trim() || "18:00");
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), Number(m[1]), Number(m[2]));
}
