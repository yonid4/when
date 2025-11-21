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

const CalendarView = ({ events = [], onSelectSlot, onSelectEvent, selectable = true }) => {
  // Calculate hour range based on events with reasonable defaults
  const hourRange = useMemo(() => {
    let minHour = 9; // Start at 7 AM
    let maxHour = 17; // End at 9 PM
    
    if (events && events.length > 0) {
      events.forEach(event => {
        const startHour = new Date(event.start).getHours();
        const endHour = new Date(event.end).getHours();
        
        if (startHour < minHour) {
          minHour = Math.max(minHour, Math.floor(startHour)); // Don't go earlier than 6 AM
        }
        if (endHour > maxHour) {
          maxHour = Math.min(maxHour, Math.ceil(endHour)); // Don't go later than 11 PM
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
        color="var(--salt-pepper-dark)"
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

  // Custom event style getter for busy slots
  const eventStyleGetter = (event) => {
    if (event.type === "busy") {
      const participantCount = event.participantCount || 1;
      // Adjust opacity based on number of busy participants (more busy = darker)
      const baseOpacity = 0.3;
      const opacityIncrement = 0.15;
      const opacity = Math.min(baseOpacity + (participantCount * opacityIncrement), 0.9);
      
      return {
        style: {
          backgroundColor: "var(--salt-pepper-dark)",
          opacity: opacity,
          borderRadius: "4px",
          border: "none",
          fontSize: "0.75rem",
          color: "white",
        }
      };
    }
    // Default styling for non-busy events
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
        },
        // Make date numbers more prominent
        '.rbc-date-cell': {
          'a': {
            fontWeight: 'bold',
            fontSize: '0.95rem',
            color: 'var(--salt-pepper-dark)',
          }
        },
        // Style the month view date cells
        '.rbc-month-view .rbc-date-cell': {
          padding: '8px',
          'a': {
            fontWeight: 'bold',
            fontSize: '1rem',
            color: 'var(--salt-pepper-dark)',
          }
        },
        // Clean day/date headers styling
        '.rbc-header': {
          borderBottom: '1px solid var(--salt-pepper-light-gray)',
          padding: '8px 4px',
          backgroundColor: 'transparent',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: 'var(--salt-pepper-dark)',
        },
        // Style the time slot labels
        '.rbc-time-header-gutter': {
          backgroundColor: 'var(--salt-pepper-white)',
        },
        '.rbc-time-slot': {
          fontSize: '0.75rem',
          color: 'var(--salt-pepper-medium-gray)',
        },
        // Event styling
        '.rbc-event': {
          backgroundColor: 'var(--salt-pepper-dark)',
          borderRadius: '4px',
          border: 'none',
          fontSize: '0.75rem',
        },
        // Selected event styling
        '.rbc-event.rbc-selected': {
          backgroundColor: 'var(--salt-pepper-medium-gray)',
        },
        // Grid lines
        '.rbc-time-view': {
          border: '1px solid var(--salt-pepper-light-gray)',
        },
        '.rbc-time-content': {
          border: 'none',
        },
        '.rbc-timeslot-group': {
          borderBottom: '1px solid var(--salt-pepper-light-gray)',
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
        selectable={selectable}
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
            header: CustomDateHeader,
          },
        }}
      />
    </Box>
  );
};

export default CalendarView; 