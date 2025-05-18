import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import multiMonthPlugin from '@fullcalendar/multimonth';

import './Calendar.css';

export function CalendarSkeleton() {
    return (
        <div className='calendar'>
            <FullCalendar
                plugins={[timeGridPlugin, dayGridPlugin, multiMonthPlugin]}
                initialView="dayGridMonth" //{viewType} // Dynamically set the view type
                headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    // right:
                    //     viewType === "timeGridWeek"
                    //         ? "timeGridWeek"
                    //         : viewType === "dayGridMonth"
                    //             ? "timeGridWeek,dayGridMonth"
                    //             : "timeGridWeek,dayGridMonth,multiMonthYear"
                }}
                showNonCurrentDates={false}
                height="auto" // Adjust height dynamically
            />
        </div>
    )
}