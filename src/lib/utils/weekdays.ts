// "2026-04" → "April 2026"
export function formatMonthLabel(yyyymm: string): string {
  const [y, m] = yyyymm.split('-');
  return new Date(Date.UTC(parseInt(y, 10), parseInt(m, 10) - 1, 1))
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

// Snap `date` to the nearest weekday (Mon–Fri) inside [start, end].
// Walks backward first, then forward. Returns null if no weekday exists in range.
export function snapToWeekdayInRange(
  date: string,
  start: string,
  end: string
): string | null {
  const startD = new Date(`${start}T00:00:00.000Z`);
  const endD = new Date(`${end}T00:00:00.000Z`);
  const target = new Date(`${date}T00:00:00.000Z`);
  const clamped = new Date(
    Math.min(endD.getTime(), Math.max(startD.getTime(), target.getTime()))
  );

  const isWeekday = (d: Date) => d.getUTCDay() !== 0 && d.getUTCDay() !== 6;

  const back = new Date(clamped);
  while (back >= startD) {
    if (isWeekday(back)) return back.toISOString().slice(0, 10);
    back.setUTCDate(back.getUTCDate() - 1);
  }
  const fwd = new Date(clamped);
  fwd.setUTCDate(fwd.getUTCDate() + 1);
  while (fwd <= endD) {
    if (isWeekday(fwd)) return fwd.toISOString().slice(0, 10);
    fwd.setUTCDate(fwd.getUTCDate() + 1);
  }
  return null;
}
