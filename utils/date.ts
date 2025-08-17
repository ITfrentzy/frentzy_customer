export function formatDisplay(dateString: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(dateString: string, days: number): string {
  const d = new Date(dateString);
  d.setDate(d.getDate() + days);
  return toDateString(d);
}

export function isBefore(a: string, b: string): boolean {
  return new Date(a).getTime() < new Date(b).getTime();
}

export function buildMarkedDates(
  start?: string | null,
  end?: string | null
): Record<string, any> {
  const color = "#0a7ea4";
  const textColor = "#fff";
  const marked: Record<string, any> = {};
  if (!start) return marked;

  if (!end || start === end) {
    marked[start] = { startingDay: true, endingDay: true, color, textColor };
    return marked;
  }

  const [from, to] = isBefore(start, end) ? [start, end] : [end, start];
  marked[from] = { startingDay: true, color, textColor };
  let cursor = addDays(from, 1);
  while (isBefore(cursor, to)) {
    marked[cursor] = { color, textColor };
    cursor = addDays(cursor, 1);
  }
  marked[to] = { endingDay: true, color, textColor };
  return marked;
}

export function to12HourFormat(time24: string): string {
  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
}
