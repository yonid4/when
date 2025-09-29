import React, { useMemo } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { Box, Button, ButtonGroup } from "@chakra-ui/react";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
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

const CalendarView = ({ events = [], onSelectSlot, onSelectEvent }) => {
  // Calculate dynamic hour range based on events
  const hourRange = useMemo(() => {
    let minHour = 8; // Default start at 8 AM
    let maxHour = 20; // Default end at 8 PM
    
    if (events && events.length > 0) {
      events.forEach(event => {
        const startHour = new Date(event.start).getHours();
        const endHour = new Date(event.end).getHours();
        
        if (startHour < minHour) {
          minHour = Math.floor(startHour);
        }
        if (endHour > maxHour) {
          maxHour = Math.ceil(endHour);
        }
      });
    }
    
    return { min: new Date(0, 0, 0, minHour, 0, 0), max: new Date(0, 0, 0, maxHour, 0, 0) };
  }, [events]);

  // Custom date header component with Chakra UI styling - plain text only
  const CustomDateHeader = ({ date, label }) => {
    return (
      <Box 
        as="div" 
        className="rbc-date-header-text"
        fontWeight="medium"
        fontSize="sm"
        color="gray.700"
        textAlign="center"
        p={1}
        cursor="default"
        pointerEvents="none"
        background="transparent"
        border="none"
        _hover={{ background: "transparent" }}
        _focus={{ background: "transparent", outline: "none" }}
        _active={{ background: "transparent" }}
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
  //   // ... implementation ...
  // };

  return (
    <Box 
      className="calendar-container"
      h="full" 
      w="full"
      sx={{
        // Modernize calendar styling with Chakra UI overrides
        '.rbc-calendar': {
          fontFamily: 'inherit',
        },
        // Make date numbers more prominent
        '.rbc-date-cell': {
          'a': {
            fontWeight: 'bold',
            fontSize: '0.95rem',
            color: 'var(--chakra-colors-gray-800)',
          }
        },
        // Style the month view date cells
        '.rbc-month-view .rbc-date-cell': {
          padding: '8px',
          'a': {
            fontWeight: 'bold',
            fontSize: '1rem',
            color: 'var(--chakra-colors-blue-600)',
          }
        },
        // Clean day/date headers styling
        '.rbc-header': {
          borderBottom: '1px solid var(--chakra-colors-gray-200)',
          padding: '8px 4px',
          backgroundColor: 'transparent',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: 'var(--chakra-colors-gray-700)',
        },
        // Style the time slot labels
        '.rbc-time-header-gutter': {
          backgroundColor: 'var(--chakra-colors-gray-50)',
        },
        '.rbc-time-slot': {
          fontSize: '0.75rem',
          color: 'var(--chakra-colors-gray-600)',
        },
        // Event styling
        '.rbc-event': {
          backgroundColor: 'var(--chakra-colors-blue-500)',
          borderRadius: '4px',
          border: 'none',
          fontSize: '0.75rem',
        },
        // Selected event styling
        '.rbc-event.rbc-selected': {
          backgroundColor: 'var(--chakra-colors-blue-700)',
        },
        // Grid lines
        '.rbc-time-view': {
          border: '1px solid var(--chakra-colors-gray-200)',
        },
        '.rbc-time-content': {
          border: 'none',
        },
        '.rbc-timeslot-group': {
          borderBottom: '1px solid var(--chakra-colors-gray-100)',
        }
      }}
    >
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
        onSelectSlot={onSelectSlot}
        onSelectEvent={onSelectEvent}
        selectable
        views={["month", "week", "day"]}
        defaultView="week"
        min={hourRange.min}
        max={hourRange.max}
        components={{
          week: {
            header: CustomDateHeader,
          },
          day: {
            header: CustomDateHeader,
          },
          month: {
            header: CustomDateHeader,
          },
        }}
      />
    </Box>
  );
};

export default CalendarView; 