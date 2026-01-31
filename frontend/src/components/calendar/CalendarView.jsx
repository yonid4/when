import React, { useMemo, useRef, useEffect, useCallback, memo } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { Box, Text, VStack, Flex } from "@chakra-ui/react";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import startOfDay from "date-fns/startOfDay";
import endOfDay from "date-fns/endOfDay";
import isSameDay from "date-fns/isSameDay";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = {
  "en-US": require("date-fns/locale/en-US"),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Memoized month date header component
const MonthDateHeader = memo(({ date }) => (
  <Box fontSize="0.875rem" fontWeight="600" color="#111827" p={2} textAlign="right">
    {format(date, 'd')}
  </Box>
));
MonthDateHeader.displayName = 'MonthDateHeader';

// Memoized month event component
const MonthEvent = memo(({ event }) => {
  if (event.type === 'month-busy') {
    return (
      <Box bg="#5f6368" color="white" px={1.5} py={0.5} borderRadius="sm" fontWeight="medium" fontSize="10px" w="full">
        {event.busyCount} busy slot{event.busyCount !== 1 ? 's' : ''}
      </Box>
    );
  }
  if (event.type === 'month-preferred') {
    return (
      <Box bg="#a142f4" color="white" px={1.5} py={0.5} borderRadius="sm" fontWeight="medium" fontSize="10px" w="full">
        {event.preferredCount} preferred slot{event.preferredCount !== 1 ? 's' : ''}
      </Box>
    );
  }
  return <span>{event.title}</span>;
});
MonthEvent.displayName = 'MonthEvent';

// Memoized Google-style date header component
const GoogleStyleDateHeader = memo(({ date, highlightDate }) => {
  const isToday = isSameDay(date, new Date());
  const isHighlighted = highlightDate && isSameDay(date, highlightDate);
  const dayOfWeek = format(date, 'EEE').toUpperCase();
  const dayNumber = format(date, 'd');

  // Determine background and text colors based on state
  let bgColor = "transparent";
  let textColor = "#3c4043";
  let fontWeightValue = "400";

  if (isToday) {
    bgColor = "#1a73e8"; // Blue for today
    textColor = "white";
    fontWeightValue = "500";
  } else if (isHighlighted) {
    bgColor = "#1e8e3e"; // Green for finalized event date
    textColor = "white";
    fontWeightValue = "500";
  }

  return (
    <VStack spacing={0} py={2} px={2} h="70px" justify="center">
      <Text fontSize="11px" fontWeight="500" color="#70757a" letterSpacing="0.8px">
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
        _hover={!isToday && !isHighlighted ? { bg: "#f1f3f4" } : {}}
      >
        {dayNumber}
      </Flex>
    </VStack>
  );
});
GoogleStyleDateHeader.displayName = 'GoogleStyleDateHeader';

// Memoized Google-style event component
const GoogleStyleEvent = memo(({ event }) => {
  // Overlap slot (split display)
  if (event.type === 'overlap') {
    const startTime = format(event.start, 'h:mm a');
    const endTime = format(event.end, 'h:mm a');
    const timeRange = `${startTime} - ${endTime}`;
    const busyCount = event.busyCount || 1;
    const baseOpacity = 0.4;
    const opacityIncrement = 0.15;
    const busyOpacity = Math.min(baseOpacity + (busyCount * opacityIncrement), 0.95);

    return (
      <VStack spacing={0} h="100%" w="100%" align="stretch" borderRadius="4px" overflow="hidden" position="relative">
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bg="white"
          px={2}
          py={1}
          borderBottom="1px solid #dadce0"
          zIndex={2}
        >
          <Text fontSize="11px" fontWeight="600" color="#3c4043" textAlign="center" whiteSpace="nowrap">
            {timeRange}
          </Text>
        </Box>
        <Flex flex="1" pt="28px" minH="0">
          <Box flex="1" bg="#5f6368" opacity={busyOpacity} display="flex" alignItems="center" justifyContent="center" px={1}>
            <Text fontSize="10px" color="white" fontWeight="500" textAlign="center">
              {event.busyCount} busy
            </Text>
          </Box>
          <Box flex="1" bg={event.preferredBackgroundColor || "#d7aefb"} display="flex" alignItems="center" justifyContent="center" px={1}>
            <Text fontSize="10px" color={event.preferredTextColor || "#5f6368"} fontWeight="500" textAlign="center">
              {event.preferredCount} available
            </Text>
          </Box>
        </Flex>
      </VStack>
    );
  }

  // Preferred slot
  if (event.type === "preferred-slot") {
    const startTime = format(event.start, 'h:mm a');
    return (
      <Box px={2} py={1} h="100%" overflow="hidden">
        <Text fontSize="11px" fontWeight="600" color={event.textColor || "#3c4043"} mb={0.5} whiteSpace="nowrap">
          {startTime}
        </Text>
        <Text fontSize="11px" color={event.textColor || "#5f6368"} whiteSpace="nowrap">
          Available
        </Text>
      </Box>
    );
  }

  // Busy slot
  if (event.type === "busy") {
    const startTime = format(event.start, 'h:mm a');
    return (
      <Box px={2} py={1} h="100%" overflow="hidden">
        <Text fontSize="11px" fontWeight="600" color="white" mb={0.5} whiteSpace="nowrap">
          {startTime}
        </Text>
        <Text fontSize="11px" color="white" opacity={0.9} whiteSpace="nowrap">
          Busy
        </Text>
      </Box>
    );
  }

  // Finalized event
  if (event.type === "finalized") {
    const startTime = format(event.start, 'h:mm a');
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
GoogleStyleEvent.displayName = 'GoogleStyleEvent';

const CalendarView = ({
  events = [],
  onSelectSlot,
  onSelectEvent,
  selectable = true,
  minTime = new Date(0, 0, 0, 8, 0, 0),
  maxTime = new Date(0, 0, 0, 20, 0, 0),
  defaultDate = null,
  highlightDate = null,
}) => {
  const [view, setView] = React.useState("week");
  const [currentDate, setCurrentDate] = React.useState(defaultDate || new Date());
  const calendarRef = useRef(null);

  // Scroll to top whenever view changes or events change
  useEffect(() => {
    if (calendarRef.current) {
      const timeContent = calendarRef.current.querySelector('.rbc-time-content');
      if (timeContent) {
        timeContent.scrollTop = 0;
      }
    }
  }, [view, events]);

  const processedEvents = useMemo(() => {
    if (view !== 'month') return events;

    const eventsByDay = new Map();
    events.forEach(event => {
      const dayKey = startOfDay(event.start).getTime();
      if (!eventsByDay.has(dayKey)) {
        eventsByDay.set(dayKey, { date: startOfDay(event.start), busyCount: 0, preferredCount: 0, busyEvents: [], preferredEvents: [] });
      }
      const dayData = eventsByDay.get(dayKey);
      if (event.type === 'busy') {
        dayData.busyCount++;
        dayData.busyEvents.push(event);
      } else if (event.type === 'preferred-slot') {
        dayData.preferredCount++;
        dayData.preferredEvents.push(event);
      }
    });

    const aggregated = [];
    eventsByDay.forEach((dayData, dayKey) => {
      if (dayData.busyCount > 0) {
        aggregated.push({
          id: `month-busy-${dayKey}`,
          title: `${dayData.busyCount} busy slot${dayData.busyCount !== 1 ? 's' : ''}`,
          start: dayData.date,
          end: endOfDay(dayData.date),
          allDay: true,
          type: 'month-busy',
          busyCount: dayData.busyCount,
          resource: { busyEvents: dayData.busyEvents }
        });
      }
      if (dayData.preferredCount > 0) {
        aggregated.push({
          id: `month-preferred-${dayKey}`,
          title: `${dayData.preferredCount} preferred slot${dayData.preferredCount !== 1 ? 's' : ''}`,
          start: dayData.date,
          end: endOfDay(dayData.date),
          allDay: true,
          type: 'month-preferred',
          preferredCount: dayData.preferredCount,
          resource: { preferredEvents: dayData.preferredEvents }
        });
      }
    });
    return aggregated;
  }, [events, view]);

  // Memoized event style getter
  const eventStyleGetter = useCallback((event) => {
    // Overlap - transparent wrapper
    if (event.type === "overlap") {
      return {
        style: {
          backgroundColor: "transparent",
          border: "1px solid #dadce0",
          borderRadius: "4px",
          padding: 0,
          overflow: "visible",
          cursor: "pointer",
          boxShadow: "0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)",
        }
      };
    }

    // Preferred slot - purple/lavender
    if (event.type === "preferred-slot") {
      return {
        style: {
          backgroundColor: event.backgroundColor || "#d7aefb",
          color: event.textColor || "#3c4043",
          border: "1px solid #b794f6",
          borderLeft: "4px solid #a142f4",
          borderRadius: "4px",
          cursor: "pointer",
          boxShadow: "0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)",
          overflow: "hidden",
        }
      };
    }

    // Busy slot - gray with opacity
    if (event.type === "busy") {
      const participantCount = event.participantCount || 1;
      const baseOpacity = 0.4;
      const opacityIncrement = 0.15;
      const opacity = Math.min(baseOpacity + (participantCount * opacityIncrement), 0.95);

      return {
        style: {
          backgroundColor: "#5f6368",
          opacity: opacity,
          border: "1px solid #5f6368",
          borderLeft: "4px solid #3c4043",
          borderRadius: "4px",
          color: "white",
          cursor: "default",
          pointerEvents: "none",
          boxShadow: "0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)",
          overflow: "hidden",
        }
      };
    }

    // Finalized event - green
    if (event.type === "finalized") {
      return {
        style: {
          backgroundColor: "#1e8e3e",
          border: "1px solid #188038",
          borderLeft: "4px solid #137333",
          borderRadius: "4px",
          color: "white",
          fontWeight: "500",
          boxShadow: "0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)",
          overflow: "hidden",
        }
      };
    }

    return {
      style: {
        backgroundColor: "#039be5",
        borderLeft: "4px solid #0288d1",
        borderRadius: "4px",
        border: "1px solid #0288d1",
        boxShadow: "0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)",
        overflow: "hidden",
      }
    };
  }, []);

  // Create header component that receives highlightDate
  const DateHeaderWithHighlight = useCallback((props) => (
    <GoogleStyleDateHeader {...props} highlightDate={highlightDate} />
  ), [highlightDate]);

  // Memoize components object to prevent unnecessary re-renders
  const calendarComponents = useMemo(() => ({
    week: {
      header: DateHeaderWithHighlight,
      event: GoogleStyleEvent,
    },
    day: {
      header: DateHeaderWithHighlight,
      event: GoogleStyleEvent,
    },
    month: {
      header: MonthDateHeader,
      event: MonthEvent,
      dateHeader: MonthDateHeader,
    },
  }), [DateHeaderWithHighlight]);

  return (
    <Box
      ref={calendarRef}
      h="full"
      w="full"
      sx={{
        // Google Calendar base styling
        '.rbc-calendar': {
          fontFamily: "'Google Sans', 'Roboto', Arial, sans-serif",
          height: '100%',
        },

        // FIXED: Header row with reduced height
        '.rbc-header': {
          borderBottom: '1px solid #dadce0',
          padding: '0 !important',
          fontWeight: '500',
          height: '70px',
          minHeight: '70px',
          overflow: 'visible',
        },

        // FIXED: Time header content
        '.rbc-time-header-content': {
          height: '70px',
          minHeight: '70px',
        },

        // FIXED: Remove horizontal line from rbc-row-bg and reduce height
        '.rbc-row-bg': {
          display: 'none !important',
        },

        // Today column
        '.rbc-today': {
          backgroundColor: '#e8f0fe',
        },

        // Time view
        '.rbc-time-view': {
          border: 'none',
          borderTop: '1px solid #dadce0',
        },

        // Time slot labels
        '.rbc-label': {
          fontSize: '10px',
          color: '#70757a',
          fontWeight: '400',
          paddingRight: '8px',
        },

        // Time slots
        '.rbc-timeslot-group': {
          minHeight: '48px',
          borderBottom: '1px solid #f0f0f0',
        },

        // Hour lines (darker)
        '.rbc-time-slot': {
          borderTop: 'none',
        },

        '.rbc-time-slot:first-child': {
          borderTop: '1px solid #dadce0',
        },

        // Time gutter
        '.rbc-time-gutter': {
          backgroundColor: 'white',
          width: '60px',
        },

        // FIXED: Time header gutter with reduced height
        '.rbc-time-header-gutter': {
          backgroundColor: 'white',
          height: '70px',
          minHeight: '70px',
        },

        // Day columns
        '.rbc-day-slot': {
          borderLeft: '1px solid #dadce0',
        },

        '.rbc-day-slot .rbc-time-slot': {
          borderTop: 'none',
        },

        // Events container
        '.rbc-events-container': {
          marginRight: '0px',
        },

        // Event wrapper
        '.rbc-event': {
          padding: 0,
        },

        '.rbc-event-content': {
          overflow: 'hidden',
        },

        '.rbc-event:focus': {
          outline: 'none',
        },

        '.rbc-selected': {
          transform: 'scale(1.01)',
          transition: 'transform 0.1s ease',
          zIndex: 4,
        },

        // Current time indicator
        '.rbc-current-time-indicator': {
          backgroundColor: '#ea4335',
          height: '2px',
          zIndex: 10,
        },

        // Add red dot at current time
        '.rbc-current-time-indicator::before': {
          content: '""',
          position: 'absolute',
          left: '-6px',
          top: '-5px',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: '#ea4335',
          border: '2px solid white',
        },

        // Toolbar
        '.rbc-toolbar': {
          padding: '12px 0',
          marginBottom: '12px',
        },

        '.rbc-toolbar button': {
          backgroundColor: 'white',
          border: '1px solid #dadce0',
          color: '#3c4043',
          padding: '8px 16px',
          borderRadius: '4px',
          fontWeight: '500',
          fontSize: '14px',
          transition: 'all 0.2s',
        },

        '.rbc-toolbar button:hover': {
          borderColor: '#d2d3d4',
          backgroundColor: '#f8f9fa',
          boxShadow: '0 1px 1px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
        },

        '.rbc-toolbar button.rbc-active': {
          backgroundColor: '#1a73e8',
          borderColor: '#1a73e8',
          color: 'white',
        },

        '.rbc-toolbar button.rbc-active:hover': {
          backgroundColor: '#1765cc',
          borderColor: '#1765cc',
        },

        // Month view
        '.rbc-month-view': {
          border: '1px solid #dadce0',
          borderRadius: '8px',
        },

        '.rbc-month-row': {
          borderTop: '1px solid #dadce0',
        },

        '.rbc-day-bg': {
          borderLeft: '1px solid #dadce0',
        },

        '.rbc-off-range-bg': {
          backgroundColor: '#f8f9fa',
        },

        // Smooth scroll behavior
        '.rbc-time-content': {
          scrollBehavior: 'smooth',
        },
      }}
    >
      <Calendar
        localizer={localizer}
        events={processedEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
        onSelectSlot={view === "month" ? null : onSelectSlot}
        onSelectEvent={view === "month" ? null : onSelectEvent}
        selectable={view === "month" ? false : selectable}
        view={view}
        onView={setView}
        views={["month", "week", "day"]}
        defaultView="week"
        date={currentDate}
        onNavigate={setCurrentDate}
        min={minTime}
        max={maxTime}
        eventPropGetter={eventStyleGetter}
        components={calendarComponents}
      />
    </Box>
  );
};

export default CalendarView;
