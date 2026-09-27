import { googleCalendarUrl, icsFile, icsFileName } from "../calendar";

const timed = {
  id: "e1",
  title: "Pizza night · UCompass",
  location: "Rymill Park, Adelaide SA",
  details: "Bring a friend\n\nWalk-in welcome.",
  start: new Date(2026, 9, 2, 18, 30),
};

describe("googleCalendarUrl", () => {
  it("uses local times and defaults to an hour", () => {
    const url = googleCalendarUrl(timed);
    expect(url).toContain("action=TEMPLATE");
    expect(url).toContain("&dates=20261002T183000/20261002T193000");
    expect(url).toContain("&ctz=Australia/Adelaide");
    expect(url).toContain(`&text=${encodeURIComponent(timed.title)}`);
    expect(url).toContain(`&location=${encodeURIComponent(timed.location)}`);
  });

  it("uses the given end", () => {
    expect(googleCalendarUrl({ ...timed, end: new Date(2026, 9, 2, 20, 30) })).toContain("20261002T183000/20261002T203000");
  });

  it("covers the whole day for all-day events, across a month end", () => {
    const url = googleCalendarUrl({ ...timed, allDay: true, start: new Date(2026, 9, 31) });
    expect(url).toContain("&dates=20261031/20261101");
  });
});

describe("icsFile", () => {
  const now = new Date(Date.UTC(2026, 8, 27, 1, 2, 3));

  it("writes a CRLF VEVENT in Adelaide time", () => {
    const ics = icsFile(timed, now);
    const lines = ics.split("\r\n");
    expect(lines[0]).toBe("BEGIN:VCALENDAR");
    expect(lines).toContain("UID:e1@ucompass.app");
    expect(lines).toContain("DTSTAMP:20260927T010203Z");
    expect(lines).toContain("DTSTART;TZID=Australia/Adelaide:20261002T183000");
    expect(lines).toContain("DTEND;TZID=Australia/Adelaide:20261002T193000");
    expect(lines[lines.length - 1]).toBe("END:VCALENDAR");
    expect(ics.replace(/\r\n/g, "")).not.toMatch(/\n/);
  });

  it("escapes commas, semicolons, backslashes and newlines", () => {
    const ics = icsFile({ ...timed, location: "Rymill Park, Adelaide; SA", details: "a\\b\nc" }, now);
    expect(ics).toContain("LOCATION:Rymill Park\\, Adelaide\\; SA");
    expect(ics).toContain("DESCRIPTION:a\\\\b\\nc");
  });

  it("marks all-day events as dates", () => {
    const ics = icsFile({ ...timed, allDay: true }, now);
    expect(ics).toContain("DTSTART;VALUE=DATE:20261002");
    expect(ics).toContain("DTEND;VALUE=DATE:20261003");
  });
});

describe("icsFileName", () => {
  it("slugs the title to 40 characters", () => {
    expect(icsFileName("Move-in: Sunny room near Rundle Mall!")).toBe("move-in-sunny-room-near-rundle-mall.ics");
    expect(icsFileName("x".repeat(60))).toBe(`${"x".repeat(40)}.ics`);
    expect(icsFileName("···")).toBe("event.ics");
  });
});
