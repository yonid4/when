/**
 * Calendar event transformation utilities
 * Functions for transforming busy slots and preferred slots for calendar display
 */

/**
 * Transform busy slots for calendar display
 * @param {Array} busySlots - Array of busy slot objects from backend
 * @returns {Array} Transformed events for calendar component
 */
export const transformBusySlotsForCalendar = (busySlots) => {
  if (!busySlots || busySlots.length === 0) return [];

  // Backend already returns merged slots with participant counts
  // Format: { start_time, end_time, busy_participants_count }
  return busySlots.map((slot, index) => ({
    id: `busy-${index}`,
    title: `${slot.busy_participants_count} participant${slot.busy_participants_count > 1 ? "s" : ""} busy`,
    start: new Date(slot.start_time),
    end: new Date(slot.end_time),
    type: "busy",
    participantCount: slot.busy_participants_count,
    allDay: false
  }));
};

/**
 * Helper function to compare arrays for equality
 * @param {Array} a - First array
 * @param {Array} b - Second array
 * @returns {boolean} True if arrays are equal
 */
const arraysEqual = (a, b) => {
  return a.length === b.length && a.every((val, index) => val === b[index]);
};

/**
 * Calculate density-based intervals for preferred slots
 * Groups overlapping time blocks and counts unique users per interval
 *
 * @param {Array} slots - Array of preferred slot objects
 * @returns {Array} Density blocks with user counts and time ranges
 */
export const calculatePreferredSlotDensity = (slots) => {
  if (!slots || slots.length === 0) return [];

  // Create time blocks with user information
  const timeBlocks = slots.map((slot) => ({
    start: new Date(slot.start_time_utc),
    end: new Date(slot.end_time_utc),
    userId: slot.user_id,
    userName: slot.user_name || "User",
    slotId: slot.id
  }));

  // Sort by start time
  timeBlocks.sort((a, b) => a.start - b.start);

  // Find all unique time points
  const timePoints = new Set();
  timeBlocks.forEach((block) => {
    timePoints.add(block.start.getTime());
    timePoints.add(block.end.getTime());
  });

  const sortedTimePoints = Array.from(timePoints).sort((a, b) => a - b);

  // For each interval, count how many users selected it
  const densityBlocks = [];

  for (let i = 0; i < sortedTimePoints.length - 1; i++) {
    const intervalStart = sortedTimePoints[i];
    const intervalEnd = sortedTimePoints[i + 1];

    // Find all slots that cover this interval
    const coveringSlots = timeBlocks.filter(
      (block) =>
        block.start.getTime() <= intervalStart && block.end.getTime() >= intervalEnd
    );

    if (coveringSlots.length > 0) {
      // Get unique users
      const uniqueUsers = new Map();
      coveringSlots.forEach((slot) => {
        uniqueUsers.set(slot.userId, {
          name: slot.userName,
          slotId: slot.slotId
        });
      });

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

  // Merge consecutive blocks with same density and same users
  const mergedBlocks = [];
  let currentBlock = null;

  densityBlocks.forEach((block) => {
    if (!currentBlock) {
      currentBlock = { ...block };
    } else if (
      currentBlock.userCount === block.userCount &&
      currentBlock.end_time_utc === block.start_time_utc &&
      arraysEqual(currentBlock.userIds.sort(), block.userIds.sort())
    ) {
      // Merge with current block
      currentBlock.end_time_utc = block.end_time_utc;
      currentBlock.slotIds = [...currentBlock.slotIds, ...block.slotIds];
    } else {
      // Push current block and start new one
      mergedBlocks.push(currentBlock);
      currentBlock = { ...block };
    }
  });

  if (currentBlock) {
    mergedBlocks.push(currentBlock);
  }

  return mergedBlocks;
};

/**
 * Get background color based on density (number of users)
 * @param {number} density - Number of users who selected this slot
 * @returns {{ backgroundColor: string, textColor: string }} Color configuration
 */
export const getDensityColors = (density) => {
  let backgroundColor;

  if (density <= 2) {
    backgroundColor = "#efbbff"; // Very light purple - 1-2 people
  } else if (density <= 4) {
    backgroundColor = "#d896ff"; // Light purple - 3-4 people
  } else if (density <= 6) {
    backgroundColor = "#be29ec"; // Medium purple - 5-6 people
  } else if (density <= 9) {
    backgroundColor = "#800080"; // Dark purple - 7-9 people
  } else {
    backgroundColor = "#660066"; // Darkest purple - 10+ people
  }

  const textColor = density >= 7 ? "white" : "#2b2b2b";

  return { backgroundColor, textColor };
};

/**
 * Transform preferred slots for calendar display with density-based coloring
 * @param {Array} preferredSlots - Array of preferred slot objects
 * @returns {Array} Transformed events for calendar component
 */
export const transformPreferredSlotsForCalendar = (preferredSlots) => {
  if (!preferredSlots || preferredSlots.length === 0) return [];

  // Use density calculation for proper merging
  const densityBlocks = calculatePreferredSlotDensity(preferredSlots);

  return densityBlocks.map((block, index) => {
    const density = block.userCount;
    const { backgroundColor, textColor } = getDensityColors(density);

    return {
      id: `preferred-${index}`,
      title: `${density} available`,
      start: new Date(block.start_time_utc),
      end: new Date(block.end_time_utc),
      type: "preferred-slot",
      density: density,
      backgroundColor: backgroundColor,
      textColor: textColor,
      slotIds: block.slotIds,
      resource: {
        userIds: block.userIds,
        userNames: block.userNames
      },
      allDay: false
    };
  });
};

/**
 * Detect overlaps between busy and preferred slots and split them properly
 * @param {Array} busyEvents - Transformed busy events
 * @param {Array} preferredEvents - Transformed preferred events
 * @returns {{ overlaps: Array, nonOverlappingBusy: Array, nonOverlappingPreferred: Array }}
 */
export const detectOverlaps = (busyEvents, preferredEvents) => {
  const overlaps = [];
  const splitBusy = [];
  const splitPreferred = [];

  // Process each busy slot
  busyEvents.forEach(busySlot => {
    const busyIntervals = [{ start: busySlot.start.getTime(), end: busySlot.end.getTime() }];

    // Find all overlaps with preferred slots
    preferredEvents.forEach(preferredSlot => {
      const overlapStart = Math.max(busySlot.start.getTime(), preferredSlot.start.getTime());
      const overlapEnd = Math.min(busySlot.end.getTime(), preferredSlot.end.getTime());

      if (overlapStart < overlapEnd) {
        // Create overlap slot
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

        // Remove overlapping portion from busy intervals
        const newIntervals = [];
        busyIntervals.forEach(interval => {
          if (interval.end <= overlapStart || interval.start >= overlapEnd) {
            // No overlap with this interval
            newIntervals.push(interval);
          } else {
            // Split the interval
            if (interval.start < overlapStart) {
              newIntervals.push({ start: interval.start, end: overlapStart });
            }
            if (interval.end > overlapEnd) {
              newIntervals.push({ start: overlapEnd, end: interval.end });
            }
          }
        });
        busyIntervals.length = 0;
        busyIntervals.push(...newIntervals);
      }
    });

    // Add remaining non-overlapping busy intervals
    busyIntervals.forEach((interval, idx) => {
      splitBusy.push({
        ...busySlot,
        id: `${busySlot.id}-split-${idx}`,
        start: new Date(interval.start),
        end: new Date(interval.end)
      });
    });
  });

  // Process each preferred slot
  preferredEvents.forEach(preferredSlot => {
    const preferredIntervals = [{ start: preferredSlot.start.getTime(), end: preferredSlot.end.getTime() }];

    // Remove overlapping portions
    busyEvents.forEach(busySlot => {
      const overlapStart = Math.max(busySlot.start.getTime(), preferredSlot.start.getTime());
      const overlapEnd = Math.min(busySlot.end.getTime(), preferredSlot.end.getTime());

      if (overlapStart < overlapEnd) {
        const newIntervals = [];
        preferredIntervals.forEach(interval => {
          if (interval.end <= overlapStart || interval.start >= overlapEnd) {
            newIntervals.push(interval);
          } else {
            if (interval.start < overlapStart) {
              newIntervals.push({ start: interval.start, end: overlapStart });
            }
            if (interval.end > overlapEnd) {
              newIntervals.push({ start: overlapEnd, end: interval.end });
            }
          }
        });
        preferredIntervals.length = 0;
        preferredIntervals.push(...newIntervals);
      }
    });

    // Add remaining non-overlapping preferred intervals
    preferredIntervals.forEach((interval, idx) => {
      splitPreferred.push({
        ...preferredSlot,
        id: `${preferredSlot.id}-split-${idx}`,
        start: new Date(interval.start),
        end: new Date(interval.end)
      });
    });
  });

  return { overlaps, nonOverlappingBusy: splitBusy, nonOverlappingPreferred: splitPreferred };
};

/**
 * Combine busy and preferred slots for calendar display with overlap detection
 * @param {Array} busySlots - Raw busy slots from API
 * @param {Array} preferredSlots - Raw preferred slots from API
 * @returns {Array} Combined calendar events
 */
export const combineCalendarEvents = (busySlots, preferredSlots) => {
  const busy = transformBusySlotsForCalendar(busySlots);
  const preferred = transformPreferredSlotsForCalendar(preferredSlots);

  const { overlaps, nonOverlappingBusy, nonOverlappingPreferred } = detectOverlaps(busy, preferred);

  return [...nonOverlappingBusy, ...nonOverlappingPreferred, ...overlaps];
};
