/**
 * Calendar event transformation utilities
 */
import { colors } from "../styles/designSystem";

/**
 * Transform busy slots for calendar display
 */
export function transformBusySlotsForCalendar(busySlots) {
  if (!busySlots || busySlots.length === 0) return [];

  return busySlots.map((slot, index) => ({
    id: `busy-${index}`,
    title: `${slot.busy_participants_count} participant${slot.busy_participants_count > 1 ? "s" : ""} busy`,
    start: new Date(slot.start_time),
    end: new Date(slot.end_time),
    type: "busy",
    participantCount: slot.busy_participants_count,
    allDay: false
  }));
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((val, index) => val === b[index]);
}

/**
 * Calculate density-based intervals for preferred slots.
 * Groups overlapping time blocks and counts unique users per interval.
 */
export function calculatePreferredSlotDensity(slots) {
  if (!slots || slots.length === 0) return [];

  const timeBlocks = slots
    .map((slot) => ({
      start: new Date(slot.start_time_utc),
      end: new Date(slot.end_time_utc),
      userId: slot.user_id,
      userName: slot.user_name || "User",
      slotId: slot.id
    }))
    .sort((a, b) => a.start - b.start);

  const timePoints = new Set();
  for (const block of timeBlocks) {
    timePoints.add(block.start.getTime());
    timePoints.add(block.end.getTime());
  }

  const sortedTimePoints = Array.from(timePoints).sort((a, b) => a - b);
  const densityBlocks = [];

  for (let i = 0; i < sortedTimePoints.length - 1; i++) {
    const intervalStart = sortedTimePoints[i];
    const intervalEnd = sortedTimePoints[i + 1];

    const coveringSlots = timeBlocks.filter(
      (block) =>
        block.start.getTime() <= intervalStart && block.end.getTime() >= intervalEnd
    );

    if (coveringSlots.length > 0) {
      const uniqueUsers = new Map();
      for (const slot of coveringSlots) {
        uniqueUsers.set(slot.userId, { name: slot.userName, slotId: slot.slotId });
      }

      densityBlocks.push({
        start_time_utc: new Date(intervalStart).toISOString(),
        end_time_utc: new Date(intervalEnd).toISOString(),
        userCount: uniqueUsers.size,
        userIds: Array.from(uniqueUsers.keys()),
        userNames: Array.from(uniqueUsers.values()).map((u) => u.name),
        slotIds: Array.from(uniqueUsers.values()).map((u) => u.slotId)
      });
    }
  }

  const mergedBlocks = [];
  let currentBlock = null;

  for (const block of densityBlocks) {
    if (!currentBlock) {
      currentBlock = { ...block };
    } else if (
      currentBlock.userCount === block.userCount &&
      currentBlock.end_time_utc === block.start_time_utc &&
      arraysEqual(currentBlock.userIds.sort(), block.userIds.sort())
    ) {
      currentBlock.end_time_utc = block.end_time_utc;
      currentBlock.slotIds = [...currentBlock.slotIds, ...block.slotIds];
    } else {
      mergedBlocks.push(currentBlock);
      currentBlock = { ...block };
    }
  }

  if (currentBlock) {
    mergedBlocks.push(currentBlock);
  }

  return mergedBlocks;
}

/**
 * Get background color based on density (number of users)
 */
export function getDensityColors(density) {
  let backgroundColor;

  if (density <= 2) {
    backgroundColor = colors.density1;
  } else if (density <= 4) {
    backgroundColor = colors.density2;
  } else if (density <= 6) {
    backgroundColor = colors.density3;
  } else if (density <= 9) {
    backgroundColor = colors.density4;
  } else {
    backgroundColor = colors.density5;
  }

  const textColor = density >= 5 ? colors.densityTextInverse : colors.densityText;

  return { backgroundColor, textColor };
}

/**
 * Transform preferred slots for calendar display with density-based coloring
 */
export function transformPreferredSlotsForCalendar(preferredSlots) {
  if (!preferredSlots || preferredSlots.length === 0) return [];

  const densityBlocks = calculatePreferredSlotDensity(preferredSlots);

  return densityBlocks.map((block, index) => {
    const { backgroundColor, textColor } = getDensityColors(block.userCount);

    return {
      id: `preferred-${index}`,
      title: `${block.userCount} available`,
      start: new Date(block.start_time_utc),
      end: new Date(block.end_time_utc),
      type: "preferred-slot",
      density: block.userCount,
      backgroundColor,
      textColor,
      slotIds: block.slotIds,
      resource: {
        userIds: block.userIds,
        userNames: block.userNames
      },
      allDay: false
    };
  });
}

/**
 * Split intervals by removing an overlapping portion
 */
function splitIntervalsForOverlap(intervals, overlapStart, overlapEnd) {
  const result = [];
  for (const interval of intervals) {
    if (interval.end <= overlapStart || interval.start >= overlapEnd) {
      result.push(interval);
    } else {
      if (interval.start < overlapStart) {
        result.push({ start: interval.start, end: overlapStart });
      }
      if (interval.end > overlapEnd) {
        result.push({ start: overlapEnd, end: interval.end });
      }
    }
  }
  return result;
}

/**
 * Detect overlaps between busy and preferred slots and split them properly
 */
export function detectOverlaps(busyEvents, preferredEvents) {
  const overlaps = [];
  const splitBusy = [];
  const splitPreferred = [];

  for (const busySlot of busyEvents) {
    let busyIntervals = [{ start: busySlot.start.getTime(), end: busySlot.end.getTime() }];

    for (const preferredSlot of preferredEvents) {
      const overlapStart = Math.max(busySlot.start.getTime(), preferredSlot.start.getTime());
      const overlapEnd = Math.min(busySlot.end.getTime(), preferredSlot.end.getTime());

      if (overlapStart < overlapEnd) {
        overlaps.push({
          id: `overlap-${busySlot.id}-${preferredSlot.id}`,
          title: `${busySlot.participantCount} busy, ${preferredSlot.density} prefer`,
          start: new Date(overlapStart),
          end: new Date(overlapEnd),
          type: "overlap",
          className: "overlap-event",
          busyCount: busySlot.participantCount,
          preferredCount: preferredSlot.density,
          preferredBackgroundColor: preferredSlot.backgroundColor,
          preferredTextColor: preferredSlot.textColor,
          allDay: false
        });

        busyIntervals = splitIntervalsForOverlap(busyIntervals, overlapStart, overlapEnd);
      }
    }

    for (let idx = 0; idx < busyIntervals.length; idx++) {
      const interval = busyIntervals[idx];
      splitBusy.push({
        ...busySlot,
        id: `${busySlot.id}-split-${idx}`,
        start: new Date(interval.start),
        end: new Date(interval.end)
      });
    }
  }

  for (const preferredSlot of preferredEvents) {
    let preferredIntervals = [{ start: preferredSlot.start.getTime(), end: preferredSlot.end.getTime() }];

    for (const busySlot of busyEvents) {
      const overlapStart = Math.max(busySlot.start.getTime(), preferredSlot.start.getTime());
      const overlapEnd = Math.min(busySlot.end.getTime(), preferredSlot.end.getTime());

      if (overlapStart < overlapEnd) {
        preferredIntervals = splitIntervalsForOverlap(preferredIntervals, overlapStart, overlapEnd);
      }
    }

    for (let idx = 0; idx < preferredIntervals.length; idx++) {
      const interval = preferredIntervals[idx];
      splitPreferred.push({
        ...preferredSlot,
        id: `${preferredSlot.id}-split-${idx}`,
        start: new Date(interval.start),
        end: new Date(interval.end)
      });
    }
  }

  return { overlaps, nonOverlappingBusy: splitBusy, nonOverlappingPreferred: splitPreferred };
}

/**
 * Combine busy and preferred slots for calendar display with overlap detection
 */
export function combineCalendarEvents(busySlots, preferredSlots) {
  const busy = transformBusySlotsForCalendar(busySlots);
  const preferred = transformPreferredSlotsForCalendar(preferredSlots);
  const { overlaps, nonOverlappingBusy, nonOverlappingPreferred } = detectOverlaps(busy, preferred);

  return [...nonOverlappingBusy, ...nonOverlappingPreferred, ...overlaps];
}
