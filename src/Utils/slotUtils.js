// src/utils/slotUtils.js

export const timeStringToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

export const minutesToTimeString = (minutes) => {
  const h = Math.floor(minutes / 60).toString().padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

export const durationToMinutes = (durationStr) => {
  // ✅ Add null/undefined check
  if (!durationStr || typeof durationStr !== 'string') {
    console.warn('Invalid duration string:', durationStr);
    return 30; // Default to 30 minutes if duration is missing
  }

  const parts = durationStr.trim().split(" ");
  let minutes = 0;
  
  for (let i = 0; i < parts.length; i += 2) {
    const val = parseInt(parts[i]);
    const unit = parts[i + 1];
    
    // ✅ Add check for unit existence
    if (!unit) continue;
    
    const lowerUnit = unit.toLowerCase();
    if (lowerUnit.includes("hour")) minutes += val * 60;
    else if (lowerUnit.includes("min")) minutes += val;
  }
  
  // ✅ Return default if parsing failed
  return minutes > 0 ? minutes : 30;
};

export const computeEndTime = (startTime, duration) => {
  const startMins = timeStringToMinutes(startTime);
  const endMins = startMins + duration;
  return minutesToTimeString(endMins);
};

// ✅ Used in SelectTimePage: groups adjacent unbooked slots to form a valid duration
export const filterMatchingSlots = (rawSlots, serviceDuration) => {
  // ✅ Add validation for serviceDuration
  if (!serviceDuration) {
    console.warn('No service duration provided, using default 30 minutes');
    serviceDuration = "30 minutes";
  }

  const serviceMins = durationToMinutes(serviceDuration);
  const filtered = [];

  // ✅ Validate rawSlots is an array
  if (!Array.isArray(rawSlots) || rawSlots.length === 0) {
    return [];
  }

  const slots = rawSlots
    .filter(s => s && s.startTime && s.endTime) // ✅ Filter out invalid slots
    .map((s) => ({
      ...s,
      startMins: timeStringToMinutes(s.startTime),
      endMins: timeStringToMinutes(s.endTime),
    }))
    .sort((a, b) => a.startMins - b.startMins);

  for (let i = 0; i < slots.length; i++) {
    let combined = [];
    let totalDuration = 0;
    let j = i;

    while (j < slots.length) {
      const current = slots[j];

      if (combined.length === 0) {
        combined.push(current);
        totalDuration += current.endMins - current.startMins;
      } else {
        const prev = combined[combined.length - 1];
        const gap = current.startMins - prev.endMins;

        if (gap === 0 && !current.isBooked) {
          combined.push(current);
          totalDuration += current.endMins - current.startMins;
        } else {
          break;
        }
      }

      if (totalDuration >= serviceMins) {
        break;
      }

      j++;
    }

    if (totalDuration >= serviceMins) {
      const anyBooked = combined.some((s) => s.isBooked);

      filtered.push({
        _id: combined.map((s) => s._id).join("_"),
        startTime: minutesToTimeString(combined[0].startMins),
        endTime: minutesToTimeString(combined[0].startMins + totalDuration),
        slotIds: combined.map((s) => s._id),
        isBooked: anyBooked,
      });
    }
  }

  return filtered;
};