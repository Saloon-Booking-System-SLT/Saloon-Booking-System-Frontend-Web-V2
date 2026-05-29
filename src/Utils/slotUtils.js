// src/utils/slotUtils.js
// ─────────────────────────────────────────────────────────────────
// Lightweight time helpers for the frontend.
//
// NOTE: filterMatchingSlots() has been removed.
// The backend (GET /api/timeslots?duration=X) now returns slots that
// are already sized to the requested service duration.
// Each slot: { startTime, endTime, conflicting, assignedProfessionalId? }
// ─────────────────────────────────────────────────────────────────

/**
 * Convert "HH:MM" string to total minutes since midnight.
 * @param {string} timeStr  e.g. "09:30"
 * @returns {number}        570
 */
export const timeStringToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

/**
 * Convert total minutes since midnight to "HH:MM" string.
 * @param {number} minutes  e.g. 570
 * @returns {string}        "09:30"
 */
export const minutesToTimeString = (minutes) => {
  const h = Math.floor(minutes / 60).toString().padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

/**
 * Parse a duration string like "30 minutes", "1 hour", "1 hour 30 minutes"
 * into total minutes.
 * @param {string|number} durationStr
 * @returns {number} minutes (defaults to 30 on parse failure)
 */
export const durationToMinutes = (durationStr) => {
  if (typeof durationStr === "number" && !isNaN(durationStr)) return durationStr;
  if (!durationStr) return 30;

  const str = String(durationStr).toLowerCase().trim();

  // Handle formats like "1h 30min", "1 hour 30 mins", "1h", "30 mins", "20min"
  const hourRegex = /(\d+)\s*(?:hour|hr|h)s?/g;
  const minRegex = /(\d+)\s*(?:min|m)s?/g;

  let totalMins = 0;

  // Extract hours
  let hourMatch;
  while ((hourMatch = hourRegex.exec(str)) !== null) {
    totalMins += parseInt(hourMatch[1], 10) * 60;
  }

  // Extract minutes
  let minMatch;
  while ((minMatch = minRegex.exec(str)) !== null) {
    totalMins += parseInt(minMatch[1], 10);
  }

  // Fallback: if no units were matched but a standalone number is present
  if (totalMins === 0) {
    const standaloneNum = parseInt(str.replace(/[^\d]/g, ""), 10);
    if (!isNaN(standaloneNum) && standaloneNum > 0) {
      if (str.includes("hour") || str.includes("h")) {
        return standaloneNum * 60;
      }
      return standaloneNum;
    }
  }

  return totalMins > 0 ? totalMins : 30;
};

/**
 * Compute the end time "HH:MM" given a start time and duration in minutes.
 * @param {string} startTime   "HH:MM"
 * @param {number} durationMin  duration in minutes
 * @returns {string} "HH:MM"
 */
export const computeEndTime = (startTime, durationMin) => {
  const startMins = timeStringToMinutes(startTime);
  const endMins   = startMins + durationMin;
  return minutesToTimeString(endMins);
};