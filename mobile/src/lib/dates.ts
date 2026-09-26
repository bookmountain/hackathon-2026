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
