import React, { useMemo } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { Box, Button, ButtonGroup, Text, VStack } from "@chakra-ui/react";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import startOfDay from "date-fns/startOfDay";
import endOfDay from "date-fns/endOfDay";
import isSameDay from "date-fns/isSameDay";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../../styles/calendar.css";

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

const CalendarView = ({
  events = [],
  onSelectSlot,
  onSelectEvent,
  selectable = true,
  minTime = new Date(0, 0, 0, 8, 0, 0),   // Default 8 AM
  maxTime = new Date(0, 0, 0, 20, 0, 0),  // Default 8 PM
}) => {
  const [view, setView] = React.useState("week");

  // Custom Month Date Header - shows just the date number, small and non-interactive
  const MonthDateHeader = ({ date, label }) => {
    return (
      <Box
        fontSize="0.875rem"
        fontWeight="600"
        color="#111827"
        p={2}
        textAlign="right"
      >
        {format(date, 'd')}
      </Box>
    );
  };

  // Custom Month Event - shows aggregated slot counts
  const MonthEvent = ({ event }) => {
    if (event.type === 'month-busy') {
      return (
        <Box
          bg="var(--salt-pepper-dark)"
          color="white"
          px={1.5}
          py={0.5}
          borderRadius="sm"
          fontWeight="medium"
          fontSize="10px"
          lineHeight="1.2"
          w="full"
        >
          {event.busyCount} busy slot{event.busyCount !== 1 ? 's' : ''}
        </Box>
      );
    }

    if (event.type === 'month-preferred') {
      return (
        <Box
          bg="#be29ec"
          color="white"
          px={1.5}
          py={0.5}
          borderRadius="sm"
          fontWeight="medium"
          fontSize="10px"
          lineHeight="1.2"
          w="full"
        >
          {event.preferredCount} preferred slot{event.preferredCount !== 1 ? 's' : ''}
        </Box>
      );
    }

    return <span>{event.title}</span>;
  };

  // Process events for month view - aggregate by day
  const processedEvents = useMemo(() => {
    if (view !== 'month') {
      return events;
    }

    // Group events by day
    const eventsByDay = new Map();

    events.forEach(event => {
      const dayKey = startOfDay(event.start).getTime();

      if (!eventsByDay.has(dayKey)) {
        eventsByDay.set(dayKey, {
          date: startOfDay(event.start),
          busyCount: 0,
          preferredCount: 0,
          busyEvents: [],
          preferredEvents: []
        });
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

    // Create separate events for busy and preferred slots
    const aggregated = [];
    eventsByDay.forEach((dayData, dayKey) => {
      // Create busy event if there are busy slots (add first for proper ordering)
      if (dayData.busyCount > 0) {
        aggregated.push({
          id: `month-busy-${dayKey}`,
          title: `${dayData.busyCount} busy slot${dayData.busyCount !== 1 ? 's' : ''}`,
          start: dayData.date,
          end: endOfDay(dayData.date),
          allDay: true,
          type: 'month-busy',
          className: 'month-busy-event',
          sortOrder: 1, // Render first
          busyCount: dayData.busyCount,
          resource: {
            busyEvents: dayData.busyEvents
          }
        });
      }

      // Create preferred event if there are preferred slots (add second)
      if (dayData.preferredCount > 0) {
        aggregated.push({
          id: `month-preferred-${dayKey}`,
          title: `${dayData.preferredCount} preferred slot${dayData.preferredCount !== 1 ? 's' : ''}`,
          start: dayData.date,
          end: endOfDay(dayData.date),
          allDay: true,
          type: 'month-preferred',
          className: 'month-preferred-event',
          sortOrder: 2, // Render second
          preferredCount: dayData.preferredCount,
          resource: {
            preferredEvents: dayData.preferredEvents
          }
        });
      }
    });

    return aggregated;
  }, [events, view]);

  // Calculate hour range based on events with reasonable defaults
  // We use the passed minTime and maxTime props if provided, otherwise default logic (though logic is largely superseded by props now)
  const hourRange = useMemo(() => {
    // If props are provided, use them directly (this allows parent to control the view)
    // Note: react-big-calendar expects Date objects for min/max
    return { min: minTime, max: maxTime };
  }, [minTime, maxTime]);

  // Custom date header component with Chakra UI styling - plain text only
  const CustomDateHeader = ({ date, label }) => {
    return (
      <Box
        as="div"
        fontWeight="600"
        fontSize="0.875rem"
        color="#374151"
        textAlign="center"
        p={2}
        letterSpacing="0.025em"
      >
        {label}
      </Box>
    );
  };

  // Custom toolbar component with Chakra UI buttons (temporarily disabled)
  // const CustomToolbar = ({ date, view, views, label, onNavigate, onView }) => {
  //   const navigate = (action) => {
  //     onNavigate(action);
  //   };
  // };

  // Custom event style getter with purple gradient for preferred slots
  const eventStyleGetter = (event) => {
    // Preferred slots - purple gradient based on density
    if (event.type === "preferred-slot") {
      return {
        style: {
          backgroundColor: event.backgroundColor,
          color: event.textColor,
          borderRadius: "4px",
          border: "none",
          fontSize: "0.75rem",
          fontWeight: "500",
          cursor: "pointer"
        }
      };
    }

    // Busy slots - keep existing dark style with opacity
    if (event.type === "busy") {
      const participantCount = event.participantCount || 1;
      // Adjust opacity based on number of busy participants (more busy = darker)
      const baseOpacity = 0.3;
      const opacityIncrement = 0.15;
      const opacity = Math.min(baseOpacity + (participantCount * opacityIncrement), 0.9);

      return {
        style: {
          backgroundColor: "var(--salt-pepper-dark)", // Keeping theme var but overriding opacity
          opacity: opacity,
          borderRadius: "4px",
          border: "none",
          fontSize: "0.75rem",
          color: "white",
          cursor: "default",
          pointerEvents: "none" // Busy slots shouldn't be interactive usually
        }
      };
    }

    // Finalized events - distinct styling
    if (event.type === "finalized") {
      return {
        style: {
          backgroundColor: "#10b981", // Green for finalized
          borderRadius: "4px",
          border: "2px solid #059669",
          fontSize: "0.75rem",
          color: "white",
          fontWeight: "bold",
        }
      };
    }

    // Default styling for other event types
    return {
      style: {
        backgroundColor: "var(--salt-pepper-dark)",
        borderRadius: "4px",
        border: "none",
        fontSize: "0.75rem",
      }
    };
  };

  return (
    <Box
      className="calendar-container"
      h="full"
      w="full"
      sx={{
        // Modernize calendar styling with Chakra UI overrides
        '.rbc-calendar': {
          fontFamily: 'inherit',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        },

        // Header styling - day labels
        '.rbc-header': {
          borderBottom: '1px solid #e5e7eb',
          padding: '12px 8px',
          backgroundColor: '#f9fafb',
          fontSize: '0.875rem',
          fontWeight: '600',
          color: '#374151',
          letterSpacing: '0.025em',
        },

        // Today's column highlight
        '.rbc-today': {
          backgroundColor: '#f0f9ff',
        },

        // Time view container
        '.rbc-time-view': {
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          overflow: 'hidden',
        },

        // Time labels (9:00 AM, 10:00 AM, etc.)
        '.rbc-time-slot': {
          fontSize: '0.75rem',
          color: '#6b7280',
          fontWeight: '500',
        },

        // Grid lines between time slots
        '.rbc-timeslot-group': {
          borderBottom: '1px solid #f3f4f6',
          minHeight: '60px', // More spacious
        },

        // Hour marks (stronger lines)
        '.rbc-time-slot:first-child': {
          borderTop: '1px solid #e5e7eb',
        },

        // Time gutter (left side with time labels)
        '.rbc-time-header-gutter': {
          backgroundColor: '#fafafa',
        },

        // Day columns
        '.rbc-day-slot': {
          position: 'relative',
        },

        // Hover effect on time slots
        '.rbc-day-slot:hover': {
          backgroundColor: '#f9fafb',
          transition: 'background-color 0.2s ease',
        },

        // Month view improvements
        '.rbc-month-view': {
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          overflow: 'hidden',
        },

        '.rbc-month-row': {
          border: 'none',
          borderTop: '1px solid #f3f4f6',
        },

        '.rbc-day-bg': {
          borderLeft: '1px solid #f3f4f6',
        },

        '.rbc-off-range-bg': {
          backgroundColor: '#fafafa',
        },

        // Date numbers in month view
        '.rbc-date-cell': {
          padding: '8px',
        },

        '.rbc-date-cell a': {
          fontWeight: '600',
          fontSize: '0.875rem',
          color: '#111827',
        },

        // Toolbar (navigation controls)
        '.rbc-toolbar': {
          padding: '16px 0',
          marginBottom: '16px',
        },

        '.rbc-toolbar button': {
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          color: '#374151',
          padding: '8px 16px',
          borderRadius: '8px',
          fontWeight: '500',
          fontSize: '0.875rem',
          transition: 'all 0.2s ease',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        },

        '.rbc-toolbar button:hover': {
          borderColor: '#d1d5db',
          backgroundColor: '#f9fafb',
          transform: 'translateY(-1px)',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        },

        '.rbc-toolbar button.rbc-active': {
          backgroundColor: '#7C3AED', // Using purple to match modern theme
          borderColor: '#7C3AED',
          color: 'white',
          boxShadow: '0 2px 4px rgba(124, 58, 237, 0.3)',
        },

        '.rbc-toolbar button.rbc-active:hover': {
          backgroundColor: '#6D28D9',
          borderColor: '#6D28D9',
        },

        // Current time indicator (red line)
        '.rbc-current-time-indicator': {
          backgroundColor: '#EF4444',
          height: '2px',
          boxShadow: '0 1px 3px rgba(239, 68, 68, 0.5)',
        },

        // Scrollbar styling for time view
        '.rbc-time-content::-webkit-scrollbar': {
          width: '8px',
        },

        '.rbc-time-content::-webkit-scrollbar-track': {
          background: '#f3f4f6',
        },

        '.rbc-time-content::-webkit-scrollbar-thumb': {
          background: '#d1d5db',
          borderRadius: '4px',
        },

        '.rbc-time-content::-webkit-scrollbar-thumb:hover': {
          background: '#9ca3af',
        },

        // Event styling
        '.rbc-event': {
          borderRadius: '4px',
          border: 'none',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
        },

        // Selected event styling
        '.rbc-event.rbc-selected': {
          opacity: 1,
          transform: 'scale(1.02)',
          zIndex: 10,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s ease',
        }
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
        min={hourRange.min}
        max={hourRange.max}
        eventPropGetter={eventStyleGetter}
        components={{
          week: {
            header: CustomDateHeader,
          },
          day: {
            header: CustomDateHeader,
          },
          month: {
            header: MonthDateHeader,
            event: MonthEvent,
            dateHeader: MonthDateHeader,
          },
        }}
      />
    </Box>
  );
};

export default CalendarView; 