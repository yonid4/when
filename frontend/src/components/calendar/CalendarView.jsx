import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { Box, Flex, Text, VStack } from "@chakra-ui/react";
import { endOfDay, format, getDay, isSameDay, parse, startOfDay, startOfWeek } from "date-fns";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { colors } from "../../styles/designSystem";

const locales = { "en-US": enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const MonthDateHeader = memo(function MonthDateHeader({ date }) {
  return (
    <Box fontSize="0.875rem" fontWeight="600" color={colors.gray900} p={2} textAlign="right">
      {format(date, "d")}
    </Box>
  );
});

const MonthEvent = memo(function MonthEvent({ event }) {
  if (event.type === "month-busy") {
    const label = event.busyCount === 1 ? "busy slot" : "busy slots";
    return (
      <Box bg={colors.calendarGoogleGray} color="white" px={1.5} py={0.5} borderRadius="sm" fontWeight="medium" fontSize="10px" w="full">
        {event.busyCount} {label}
      </Box>
    );
  }
  if (event.type === "month-preferred") {
    const label = event.preferredCount === 1 ? "preferred slot" : "preferred slots";
    return (
      <Box bg={colors.calendarGooglePurple} color="white" px={1.5} py={0.5} borderRadius="sm" fontWeight="medium" fontSize="10px" w="full">
        {event.preferredCount} {label}
      </Box>
    );
  }
  return <span>{event.title}</span>;
});

const GoogleStyleDateHeader = memo(function GoogleStyleDateHeader({ date, highlightDate }) {
  const isToday = isSameDay(date, new Date());
  const isHighlighted = highlightDate && isSameDay(date, highlightDate);
  const dayOfWeek = format(date, "EEE").toUpperCase();
  const dayNumber = format(date, "d");

  let bgColor = "transparent";
  let textColor = colors.calendarGridText;
  let fontWeightValue = "400";

  if (isToday) {
    bgColor = colors.calendarGoogleBlue;
    textColor = "white";
    fontWeightValue = "500";
  } else if (isHighlighted) {
    bgColor = colors.calendarGoogleGreen;
    textColor = "white";
    fontWeightValue = "500";
  }

  const hoverStyle = !isToday && !isHighlighted ? { bg: colors.calendarGridHover } : {};

  return (
    <VStack spacing={0} py={2} px={2} h="70px" justify="center">
      <Text fontSize="11px" fontWeight="500" color={colors.calendarGridLabel} letterSpacing="0.8px">
        {dayOfWeek}
      </Text>
      <Flex
        mt={1}
        w="46px"
        h="46px"
        align="center"
        justify="center"
        borderRadius="full"
        bg={bgColor}
        color={textColor}
        fontWeight={fontWeightValue}
        fontSize="24px"
        lineHeight="1"
        transition="all 0.2s"
        _hover={hoverStyle}
      >
        {dayNumber}
      </Flex>
    </VStack>
  );
});

const GoogleStyleEvent = memo(function GoogleStyleEvent({ event }) {
  const startTime = format(event.start, "h:mm a");

  if (event.type === "overlap") {
    const endTime = format(event.end, "h:mm a");
    const timeRange = `${startTime} - ${endTime}`;
    const busyCount = event.busyCount || 1;
    const busyOpacity = Math.min(0.4 + busyCount * 0.15, 0.95);

    return (
      <VStack spacing={0} h="100%" w="100%" align="stretch" borderRadius="4px" overflow="hidden" position="relative">
        <Box position="absolute" top="0" left="0" right="0" bg="white" px={2} py={1} borderBottom={`1px solid ${colors.calendarGridBorder}`} zIndex={2}>
          <Text fontSize="11px" fontWeight="600" color={colors.calendarGridText} textAlign="center" whiteSpace="nowrap">
            {timeRange}
          </Text>
        </Box>
        <Flex flex="1" pt="28px" minH="0">
          <Box flex="1" bg={colors.calendarGoogleGray} opacity={busyOpacity} display="flex" alignItems="center" justifyContent="center" px={1}>
            <Text fontSize="10px" color="white" fontWeight="500" textAlign="center">
              {event.busyCount} busy
            </Text>
          </Box>
          <Box flex="1" bg={event.preferredBackgroundColor || colors.calendarEventPurpleBg} display="flex" alignItems="center" justifyContent="center" px={1}>
            <Text fontSize="10px" color={event.preferredTextColor || colors.calendarGoogleGray} fontWeight="500" textAlign="center">
              {event.preferredCount} available
            </Text>
          </Box>
        </Flex>
      </VStack>
    );
  }

  if (event.type === "preferred-slot") {
    return (
      <Box px={2} py={1} h="100%" overflow="hidden">
        <Text fontSize="11px" fontWeight="600" color={event.textColor || colors.calendarGridText} mb={0.5} whiteSpace="nowrap">
          {startTime}
        </Text>
        <Text fontSize="11px" color={event.textColor || colors.calendarGoogleGray} whiteSpace="nowrap">
          {event.density} available
        </Text>
      </Box>
    );
  }

  if (event.type === "busy") {
    return (
      <Box px={2} py={1} h="100%" overflow="hidden">
        <Text fontSize="11px" fontWeight="600" color="white" mb={0.5} whiteSpace="nowrap">
          {startTime}
        </Text>
        <Text fontSize="11px" color="white" opacity={0.9} whiteSpace="nowrap">
          {event.participantCount} busy
        </Text>
      </Box>
    );
  }

  if (event.type === "finalized") {
    return (
      <Box px={2} py={1} h="100%" overflow="hidden">
        <Text fontSize="11px" fontWeight="600" color="white" mb={0.5} whiteSpace="nowrap">
          {startTime}
        </Text>
        <Text fontSize="11px" color="white" whiteSpace="nowrap">
          {event.title}
        </Text>
      </Box>
    );
  }

  return <span>{event.title}</span>;
});

function CalendarView({
  events = [],
  onSelectSlot,
  onSelectEvent,
  selectable = true,
  minTime = new Date(0, 0, 0, 8, 0, 0),
  maxTime = new Date(0, 0, 0, 20, 0, 0),
  defaultDate = null,
  highlightDate = null,
}) {
  const [view, setView] = useState("week");
  const [currentDate, setCurrentDate] = useState(defaultDate || new Date());
  const calendarRef = useRef(null);

  useEffect(() => {
    const timeContent = calendarRef.current?.querySelector(".rbc-time-content");
    if (timeContent) {
      timeContent.scrollTop = 0;
    }
  }, [view, events]);

  const processedEvents = useMemo(() => {
    if (view !== "month") return events;

    const eventsByDay = new Map();
    for (const event of events) {
      const dayKey = startOfDay(event.start).getTime();
      if (!eventsByDay.has(dayKey)) {
        eventsByDay.set(dayKey, {
          date: startOfDay(event.start),
          busyCount: 0,
          preferredCount: 0,
          busyEvents: [],
          preferredEvents: [],
        });
      }
      const dayData = eventsByDay.get(dayKey);
      if (event.type === "busy") {
        dayData.busyCount++;
        dayData.busyEvents.push(event);
      } else if (event.type === "preferred-slot") {
        dayData.preferredCount++;
        dayData.preferredEvents.push(event);
      }
    }

    const aggregated = [];
    for (const [dayKey, dayData] of eventsByDay) {
      if (dayData.busyCount > 0) {
        const label = dayData.busyCount === 1 ? "slot" : "slots";
        aggregated.push({
          id: `month-busy-${dayKey}`,
          title: `${dayData.busyCount} busy ${label}`,
          start: dayData.date,
          end: endOfDay(dayData.date),
          allDay: true,
          type: "month-busy",
          busyCount: dayData.busyCount,
          resource: { busyEvents: dayData.busyEvents },
        });
      }
      if (dayData.preferredCount > 0) {
        const label = dayData.preferredCount === 1 ? "slot" : "slots";
        aggregated.push({
          id: `month-preferred-${dayKey}`,
          title: `${dayData.preferredCount} preferred ${label}`,
          start: dayData.date,
          end: endOfDay(dayData.date),
          allDay: true,
          type: "month-preferred",
          preferredCount: dayData.preferredCount,
          resource: { preferredEvents: dayData.preferredEvents },
        });
      }
    }
    return aggregated;
  }, [events, view]);

  const eventStyleGetter = useCallback((event) => {
    const baseBoxShadow = "0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)";

    if (event.type === "overlap") {
      return {
        style: {
          backgroundColor: "transparent",
          border: `1px solid ${colors.calendarGridBorder}`,
          borderRadius: "4px",
          padding: 0,
          overflow: "visible",
          cursor: "pointer",
          boxShadow: baseBoxShadow,
        },
      };
    }

    if (event.type === "preferred-slot") {
      return {
        style: {
          backgroundColor: event.backgroundColor || colors.calendarEventPurpleBg,
          color: event.textColor || colors.calendarGridText,
          border: "1px solid #b794f6",
          borderLeft: `4px solid ${colors.calendarGooglePurple}`,
          borderRadius: "4px",
          cursor: "pointer",
          boxShadow: baseBoxShadow,
          overflow: "hidden",
        },
      };
    }

    if (event.type === "busy") {
      const participantCount = event.participantCount || 1;
      const opacity = Math.min(0.4 + participantCount * 0.15, 0.95);

      return {
        style: {
          backgroundColor: colors.calendarGoogleGray,
          opacity,
          border: `1px solid ${colors.calendarGoogleGray}`,
          borderLeft: `4px solid ${colors.calendarGridText}`,
          borderRadius: "4px",
          color: "white",
          cursor: "default",
          pointerEvents: "none",
          boxShadow: baseBoxShadow,
          overflow: "hidden",
        },
      };
    }

    if (event.type === "finalized") {
      return {
        style: {
          backgroundColor: colors.calendarGoogleGreen,
          border: `1px solid ${colors.calendarGoogleGreen}`,
          borderLeft: `4px solid ${colors.calendarGoogleGreenDark}`,
          borderRadius: "4px",
          color: "white",
          fontWeight: "500",
          boxShadow: baseBoxShadow,
          overflow: "hidden",
        },
      };
    }

    return {
      style: {
        backgroundColor: colors.calendarGoogleCyan,
        borderLeft: `4px solid ${colors.calendarGoogleCyan}`,
        borderRadius: "4px",
        border: `1px solid ${colors.calendarGoogleCyan}`,
        boxShadow: baseBoxShadow,
        overflow: "hidden",
      },
    };
  }, []);

  const DateHeaderWithHighlight = useCallback(
    (props) => <GoogleStyleDateHeader {...props} highlightDate={highlightDate} />,
    [highlightDate]
  );

  const dayPropGetter = useCallback(
    (date) => {
      if (highlightDate && isSameDay(date, highlightDate)) {
        return { style: { backgroundColor: colors.calendarEventGreenBg } };
      }
      return {};
    },
    [highlightDate]
  );

  const calendarComponents = useMemo(
    () => ({
      week: { header: DateHeaderWithHighlight, event: GoogleStyleEvent },
      day: { header: DateHeaderWithHighlight, event: GoogleStyleEvent },
      month: { header: MonthDateHeader, event: MonthEvent, dateHeader: MonthDateHeader },
    }),
    [DateHeaderWithHighlight]
  );

  const calendarStyles = {
    ".rbc-calendar": {
      fontFamily: "'Google Sans', 'Roboto', Arial, sans-serif",
      height: "100%",
    },
    ".rbc-header": {
      borderBottom: `1px solid ${colors.calendarGridBorder}`,
      padding: "0 !important",
      fontWeight: "500",
      height: "70px",
      minHeight: "70px",
      overflow: "visible",
    },
    ".rbc-time-header-content": { height: "70px", minHeight: "70px" },
    ".rbc-row-bg": { display: "none !important" },
    ".rbc-today": { backgroundColor: colors.calendarTodayBg },
    ".rbc-time-view": { border: "none", borderTop: `1px solid ${colors.calendarGridBorder}` },
    ".rbc-label": { fontSize: "10px", color: colors.calendarGridLabel, fontWeight: "400", paddingRight: "8px" },
    ".rbc-timeslot-group": { minHeight: "48px", borderBottom: "1px solid #f0f0f0" },
    ".rbc-time-slot": { borderTop: "none" },
    ".rbc-time-slot:first-child": { borderTop: `1px solid ${colors.calendarGridBorder}` },
    ".rbc-time-gutter": { backgroundColor: "white", width: "60px" },
    ".rbc-time-header-gutter": { backgroundColor: "white", height: "70px", minHeight: "70px" },
    ".rbc-day-slot": { borderLeft: `1px solid ${colors.calendarGridBorder}` },
    ".rbc-day-slot .rbc-time-slot": { borderTop: "none" },
    ".rbc-events-container": { marginRight: "0px" },
    ".rbc-event": { padding: 0 },
    ".rbc-event-content": { overflow: "hidden" },
    ".rbc-event:focus": { outline: "none" },
    ".rbc-selected": { transform: "scale(1.01)", transition: "transform 0.1s ease", zIndex: 4 },
    ".rbc-current-time-indicator": { backgroundColor: colors.calendarGoogleRed, height: "2px", zIndex: 10 },
    ".rbc-current-time-indicator::before": {
      content: '""',
      position: "absolute",
      left: "-6px",
      top: "-5px",
      width: "12px",
      height: "12px",
      borderRadius: "50%",
      backgroundColor: colors.calendarGoogleRed,
      border: "2px solid white",
    },
    ".rbc-toolbar": { padding: "12px 0", marginBottom: "12px" },
    ".rbc-toolbar button": {
      backgroundColor: "white",
      border: `1px solid ${colors.calendarGridBorder}`,
      color: colors.calendarGridText,
      padding: "8px 16px",
      borderRadius: "4px",
      fontWeight: "500",
      fontSize: "14px",
      transition: "all 0.2s",
    },
    ".rbc-toolbar button:hover": {
      borderColor: "#d2d3d4",
      backgroundColor: colors.calendarGridHover,
      boxShadow: "0 1px 1px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)",
    },
    ".rbc-toolbar button.rbc-active": { backgroundColor: colors.calendarGoogleBlue, borderColor: colors.calendarGoogleBlue, color: "white" },
    ".rbc-toolbar button.rbc-active:hover": { backgroundColor: "#1765cc", borderColor: "#1765cc" },
    ".rbc-month-view": { border: `1px solid ${colors.calendarGridBorder}`, borderRadius: "8px" },
    ".rbc-month-row": { borderTop: `1px solid ${colors.calendarGridBorder}` },
    ".rbc-day-bg": { borderLeft: `1px solid ${colors.calendarGridBorder}` },
    ".rbc-off-range-bg": { backgroundColor: colors.calendarGridHover },
    ".rbc-time-content": { scrollBehavior: "smooth" },
  };

  return (
    <Box ref={calendarRef} h="full" w="full" sx={calendarStyles}>
      <Calendar
        localizer={localizer}
        events={processedEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
        onSelectSlot={view === "month" ? null : onSelectSlot}
        onSelectEvent={view === "month" ? null : onSelectEvent}
        selectable={view !== "month" && selectable}
        view={view}
        onView={setView}
        views={["month", "week", "day"]}
        defaultView="week"
        date={currentDate}
        onNavigate={setCurrentDate}
        min={minTime}
        max={maxTime}
        eventPropGetter={eventStyleGetter}
        dayPropGetter={dayPropGetter}
        components={calendarComponents}
      />
    </Box>
  );
}

export default CalendarView;
