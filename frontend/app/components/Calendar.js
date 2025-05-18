'use client'

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import multiMonthPlugin from '@fullcalendar/multimonth';
import interactionPlugin from '@fullcalendar/interaction';

import { useState, useEffect } from 'react';

// import { CalendarSkeleton } from "./CalendarSkeleton"

import "../Calendar.css"


async function fetchUsersEvents() {
    return [
        {
            id: "1",
            title: "Client Meeting",
            start: "2025-01-11T10:00:00",
            end: "2025-01-11T12:00:00"
        },
        {
            id: "2",
            title: "Code Review",
            start: "2025-01-12T14:00:00",
            end: "2025-01-12T15:00:00"
        }
    ];
}

// async function fetchDates() {
//     const response = await fetch("https://api.example.com/dates"); // Replace with your API endpoint
//     if (!response.ok) {
//         throw new Error("Failed to fetch dates");
//     }
//     return await response.json();
// }
async function fetchDates() {
    return {
        startDate: "2025-01-10",
        endDate: "2025-01-16",
        earliestTime: "10:00:00",
        latestTime: "16:00:00",
    };
}

export default function CalendarWrapper() {
    const [event, setEvent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchEventData = async () => {
            try {
                const data = await fetchDates(); // Call fetch function (hardcoded for now)
                setEvent(data); // Update state with fetched data
            } catch (error) {
                console.error("Error fetching event data:", error);
            } finally {
                setIsLoading(false); // Stop loading after data is fetched
            }
        };

        fetchEventData();
    }, []);

    if (isLoading) {
        return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", width: "100%" }}>Loading Calendar...</div>;
    }

    return (
        <div className="calendar">
            <Calendar startDate={event.startDate} endDate={event.endDate} />
        </div>
    );
}

// function daysInThisMonth() {
//     var now = new Date();
//     return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
// }

export function Calendar({ startDate, endDate }) {
    // console.log(`hello ${startDate}, ${endDate}`)
    const calculateViewType = (startDate, endDate) => {
        if (!startDate || !endDate) return "timeGridWeek";

        const start = new Date(startDate);
        const end = new Date(endDate);

        const differenceInMilliseconds = end - start;
        const differenceInDays = differenceInMilliseconds / 1000 / 60 / 60 / 24;

        if (differenceInDays <= 7) {
            return "timeGridWeek";
        } else if (differenceInDays <= 31) {
            return "dayGridMonth";
        } else {
            return "multiMonthYear";
        }
    };

    // setVisibleRange({
    //     start: start.toISOString(), // Convert to ISO string for FullCalendar
    //     end: end.toISOString(),
    // });

    console.log(`Start Date: ${startDate}, End Date: ${endDate}`);

    const [viewType] = useState(() => calculateViewType(startDate, endDate));
    const [eventsList, setEventsList] = useState([])
    // const [visibleRange, setVisibleRange] = useState(null);

    useEffect(() => {
        const fetchEvents = async () => {
            const events = await fetchUsersEvents();
            setEventsList(events);
        };
        fetchEvents();
    }, []);

    const handleDateSelect = (selectInfo) => {
        const title = prompt('Please enter a title for your availability:');
        if (title) {
            const calendarApi = selectInfo.view.calendar;
            calendarApi.unselect(); // clear date selection

            const newEvent = {
                id: String(new Date().getTime()), // Generate unique ID
                title,
                start: selectInfo.startStr,
                end: selectInfo.endStr,
                allDay: selectInfo.allDay
            };

            setEventsList([...eventsList, newEvent]);
        }
    };

    const handleEventClick = (clickInfo) => {
        const eventTitle = clickInfo.event.title;
        if (window.confirm(`Do you want to delete the event: "${eventTitle}"?`)) {
            setEventsList(eventsList.filter(event => event.id !== clickInfo.event.id));
        }
    };

    return (
        <div className="calendar">
            <FullCalendar
                plugins={[timeGridPlugin, dayGridPlugin, multiMonthPlugin, interactionPlugin]}
                initialView={viewType}
                headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    right:
                        viewType === "timeGridWeek"
                            ? "timeGridWeek"
                            : viewType === "dayGridMonth"
                                ? "timeGridWeek,dayGridMonth"
                                : "timeGridWeek,dayGridMonth,multiMonthYear"
                }}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                weekends={true}
                events={eventsList}
                select={handleDateSelect}
                eventClick={handleEventClick}
                height="1000%"
                slotMinTime="00:00:00"
                slotMaxTime="23:59:59"
                slotDuration="00:30:00"
                allDaySlot={false}
            />
        </div>
    )
}

