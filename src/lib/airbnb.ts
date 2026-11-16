export type DateRange = { start: string; end: string };

let cache: { at: number; ranges: DateRange[] } | null = null;

export function parseIcs(text: string): DateRange[] {
  const unfolded = text.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
  const ranges: DateRange[] = [];
  for (const event of unfolded.split("BEGIN:VEVENT").slice(1)) {
    const start = readDate(event, "DTSTART");
    const end = readDate(event, "DTEND");
    if (start && end && end > start) ranges.push({ start, end });
  }
  return ranges;
}

function readDate(block: string, key: string) {
  const match = block.match(new RegExp(`${key}(?:;[^:\\r\\n]*)?:(\\d{8})`));
  if (!match) return null;
  const value = match[1];
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

export async function airbnbRanges(): Promise<DateRange[]> {
  const url = process.env.AIRBNB_ICAL_URL;
  if (!url) return [];
  if (cache && Date.now() - cache.at < 15 * 60 * 1000) return cache.ranges;
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`Airbnb calendar responded ${response.status}`);
    const ranges = parseIcs(await response.text());
    cache = { at: Date.now(), ranges };
    return ranges;
  } catch (error) {
    console.error("Airbnb calendar fetch failed", error);
    return cache?.ranges ?? [];
  }
}

export function buildIcs(events: { id: string; start: string; end: string; summary: string }[]) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//The Loony'Bin//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  for (const event of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.id}@the-loony-bin`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART;VALUE=DATE:${event.start.replaceAll("-", "")}`,
      `DTEND;VALUE=DATE:${event.end.replaceAll("-", "")}`,
      `SUMMARY:${escapeText(event.summary)}`,
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}

function stamp(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}
