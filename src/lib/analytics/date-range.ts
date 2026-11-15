import "server-only";

export type AnalyticsPeriod = "today" | "yesterday" | "7d" | "30d" | "3m" | "12m" | "custom";
export type AnalyticsDateRange = { start: Date; end: Date; previousStart: Date; previousEnd: Date; period: AnalyticsPeriod };

const DAY_MS = 24 * 60 * 60 * 1000;

export function getAnalyticsDateRange(periodValue?: string | null, startValue?: string | null, endValue?: string | null, now = new Date()): AnalyticsDateRange {
  const period: AnalyticsPeriod = ["today", "yesterday", "7d", "30d", "3m", "12m", "custom"].includes(periodValue ?? "")
    ? periodValue as AnalyticsPeriod
    : "30d";
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  let start: Date;
  let end: Date;
  switch (period) {
    case "today":
      start = todayStart;
      end = new Date(todayStart.getTime() + DAY_MS);
      break;
    case "yesterday":
      start = new Date(todayStart.getTime() - DAY_MS);
      end = todayStart;
      break;
    case "7d":
      end = new Date(todayStart.getTime() + DAY_MS);
      start = new Date(end.getTime() - 7 * DAY_MS);
      break;
    case "3m":
      end = new Date(todayStart.getTime() + DAY_MS);
      start = new Date(Date.UTC(todayStart.getUTCFullYear(), todayStart.getUTCMonth() - 3, todayStart.getUTCDate()));
      break;
    case "12m":
      end = new Date(todayStart.getTime() + DAY_MS);
      start = new Date(Date.UTC(todayStart.getUTCFullYear(), todayStart.getUTCMonth() - 12, todayStart.getUTCDate()));
      break;
    case "custom": {
      const parsedStart = parseDate(startValue);
      const parsedEnd = parseDate(endValue);
      if (!parsedStart || !parsedEnd || parsedEnd < parsedStart) {
        periodValue = "30d";
        return getAnalyticsDateRange("30d", null, null, now);
      }
      start = parsedStart;
      end = new Date(parsedEnd.getTime() + DAY_MS);
      if (end.getTime() - start.getTime() > 366 * DAY_MS) end = new Date(start.getTime() + 366 * DAY_MS);
      break;
    }
    default:
      end = new Date(todayStart.getTime() + DAY_MS);
      start = new Date(end.getTime() - 30 * DAY_MS);
  }
  const duration = end.getTime() - start.getTime();
  return { start, end, previousStart: new Date(start.getTime() - duration), previousEnd: start, period };
}

export function parseAnalyticsRange(params: URLSearchParams) {
  return getAnalyticsDateRange(params.get("period"), params.get("start"), params.get("end"));
}

function parseDate(value?: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}
