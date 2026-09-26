// Fixed English (Australian) date labels. Built by hand so they read the same
// on every device regardless of locale settings.

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "14 Oct" */
export function dayMonth(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "TUE" */
export function weekdayCaps(d: Date): string {
  return WEEKDAYS[d.getDay()].toUpperCase();
}

/** "7:00 pm" */
export function clockTime(d: Date): string {
  const hours = d.getHours();
  const h12 = hours % 12 || 12;
  return `${h12}:${String(d.getMinutes()).padStart(2, "0")} ${hours < 12 ? "am" : "pm"}`;
}

/** "Tue 29 Sep · 7:00 pm" */
export function eventWhen(d: Date): string {
  return `${WEEKDAYS[d.getDay()]} ${dayMonth(d)} · ${clockTime(d)}`;
}

/** "2026-10-14" (an API date) as local midnight */
export function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Local calendar date as the API's "2026-10-14" */
export function toDateOnly(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** "Just now", "5m ago", "2h ago", "3d ago", then "14 Oct" */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const minutes = Math.floor((now.getTime() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return dayMonth(new Date(iso));
}
