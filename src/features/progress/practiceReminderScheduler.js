const MINUTE_MS = 60 * 1000
const DEFAULT_REMINDER_DAYS = [0, 1, 2, 3, 4, 5, 6]

export function normalizeReminderDays(days) {
  if (!Array.isArray(days) || days.length === 0) {
    return DEFAULT_REMINDER_DAYS
  }

  return days
    .map((day) => Number(day))
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
}

export function getMsUntilNextMinute(nowMs = Date.now()) {
  const remainder = nowMs % MINUTE_MS
  return remainder === 0 ? MINUTE_MS : MINUTE_MS - remainder
}
