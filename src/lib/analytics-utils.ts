import { subDays, startOfMonth, subMonths, endOfMonth, startOfDay, endOfDay } from "date-fns";

export type DateRangeFilter = "TODAY" | "YESTERDAY" | "LAST_7_DAYS" | "LAST_30_DAYS" | "THIS_MONTH" | "LAST_MONTH" | "CUSTOM";

export function getDateRange(filter: DateRangeFilter, customStart?: Date, customEnd?: Date) {
  const now = new Date();
  let start = startOfDay(now);
  let end = endOfDay(now);

  switch (filter) {
    case "TODAY":
      start = startOfDay(now);
      end = endOfDay(now);
      break;
    case "YESTERDAY":
      const yesterday = subDays(now, 1);
      start = startOfDay(yesterday);
      end = endOfDay(yesterday);
      break;
    case "LAST_7_DAYS":
      start = startOfDay(subDays(now, 7));
      end = endOfDay(now);
      break;
    case "LAST_30_DAYS":
      start = startOfDay(subDays(now, 30));
      end = endOfDay(now);
      break;
    case "THIS_MONTH":
      start = startOfMonth(now);
      end = endOfDay(now);
      break;
    case "LAST_MONTH":
      const lastMonth = subMonths(now, 1);
      start = startOfMonth(lastMonth);
      end = endOfMonth(lastMonth);
      break;
    case "CUSTOM":
      if (customStart && customEnd) {
        start = startOfDay(customStart);
        end = endOfDay(customEnd);
      }
      break;
  }

  return { start, end };
}

export function getPreviousDateRange(filter: DateRangeFilter, currentStart: Date, currentEnd: Date) {
  const durationMs = currentEnd.getTime() - currentStart.getTime();
  
  if (filter === "THIS_MONTH") {
    const prevMonth = subMonths(currentStart, 1);
    return { start: startOfMonth(prevMonth), end: endOfMonth(prevMonth) };
  } else if (filter === "LAST_MONTH") {
    const prevMonth = subMonths(currentStart, 1);
    return { start: startOfMonth(prevMonth), end: endOfMonth(prevMonth) };
  }

  // Generic shift by same duration
  const start = new Date(currentStart.getTime() - durationMs - 1);
  const end = new Date(currentEnd.getTime() - durationMs - 1);
  return { start: startOfDay(start), end: endOfDay(end) };
}

export function calculatePercentageChange(current: number, previous: number) {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}
