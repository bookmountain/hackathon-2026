// "Add to calendar": Google Calendar template links and .ics files (Apple Calendar)

export type CalendarEvent = {
  id: string;
  title: string;
  location: string;
  details: string;
  start: Date;
  /** Timed events default to an hour; all-day events cover the start date */
  end?: Date;
  allDay?: boolean;
  /** Alerts before the start, as ISO 8601 durations ("P2D" = two days before); .ics only */
  alarms?: string[];
};

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
/** Local wall-clock time; the calendar is told it's Adelaide time */
const localStamp = (d: Date) => `${ymd(d)}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
const utcStamp = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

function range(e: CalendarEvent): [string, string] {
  if (e.allDay) {
    const next = new Date(e.start.getFullYear(), e.start.getMonth(), e.start.getDate() + 1);
    return [ymd(e.start), ymd(next)];
  }
  const end = e.end ?? new Date(e.start.getTime() + 60 * 60 * 1000);
  return [localStamp(e.start), localStamp(end)];
}

export function googleCalendarUrl(e: CalendarEvent): string {
  const [a, b] = range(e);
  const q = (s: string) => encodeURIComponent(s);
  return (
    `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${q(e.title)}&dates=${a}/${b}` +
    `&ctz=Australia/Adelaide&details=${q(e.details)}&location=${q(e.location)}`
  );
}

const escapeIcs = (s: string) => s.replace(/\\/g, "\\\\").replace(/([,;])/g, "\\$1").replace(/\r?\n/g, "\\n");

/** A display alert `duration` before the start (Google links can't carry alarms) */
export function valarm(duration: string, title: string): string[] {
  return ["BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${escapeIcs(title)}`, `TRIGGER:-${duration}`, "END:VALARM"];
}

export function icsFile(e: CalendarEvent, now = new Date()): string {
  const [a, b] = range(e);
  const when = (v: string) => (e.allDay ? `;VALUE=DATE:${v}` : `;TZID=Australia/Adelaide:${v}`);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//UCompass//Demo//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${e.id}@ucompass.app`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART${when(a)}`,
    `DTEND${when(b)}`,
    `SUMMARY:${escapeIcs(e.title)}`,
    `LOCATION:${escapeIcs(e.location)}`,
    `DESCRIPTION:${escapeIcs(e.details)}`,
    ...(e.alarms ?? []).flatMap((d) => valarm(d, e.title)),
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/** "Move-in: Sunny room" → "move-in-sunny-room.ics" */
export function icsFileName(title: string): string {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  return `${slug || "event"}.ics`;
}
