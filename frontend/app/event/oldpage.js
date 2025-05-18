'use client';

import styles from "../page.module.css";

import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import { Calendar } from '@fullcalendar/core'

import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import multiMonthPlugin from '@fullcalendar/multimonth';
import interactionPlugin from '@fullcalendar/interaction'; // Import interaction plugin

import '../Calendar.css';

const eventsList = [
    { title: 'Meeting', start: '2025-01-10T12:15:00', end: '2025-01-10T16:00:00' },
    { title: 'Football', start: '2025-01-11T16:00:00' }
];

function Event() {
    const [timeZone, setTimeZone] = useState('UTC'); // Default timezone

    // Detect user's timezone when the component mounts
    useEffect(() => {
        const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setTimeZone(userTimeZone); // Set the detected timezone
    }, []);

    const handleDateClick = (info) => {
        alert(`Date clicked: ${info.dateStr}`);
    };

    useEffect(() => {

    })

    return (
        <div className="eventGrid">
            <div className="auto_create">auto create</div>
            <div className="i1">
                <div className="calendar">
                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="dayGridWeek"
                        weekends={true}
                        events={eventsList}
                        eventContent={renderEventContent}
                        dayCellContent={renderDayCellContent}
                        selectable={true} // Enable selecting dates
                        dateClick={handleDateClick}
                        timeZone={timeZone} // Use the dynamic timezone
                        height="100%" // Use 100% height for proper resizing
                    />
                </div>
                <div className="user_list">
                    <form>
                        <div class="form-group">
                            <label htmlFor="newEmail">User list:</label>
                            <input type="email" id="newemail" name="newemail" placeholder="user@gmail.com"></input>
                        </div>
                    </form>
                </div>
                <div className="preferences">preferences</div>
            </div>
            <div className="copy_link">copy link</div>
        </div>
    );
}

function renderEventContent(eventInfo) {
    return (
        <>
            <b>{eventInfo.timeText}</b>
            <i>{eventInfo.event.title}</i>
        </>
    );
}

function renderDayCellContent(dayCellContent) {
    return (
        <div>
            <div>{dayCellContent.dayNumberText}</div>
        </div>
    );
}



function daysInThisMonth() {
    var now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

function Cal() {
    const [lengthOfEventInDays, setLengthOfEventInDays] = useState({
        length: 0
    })

    const [event, setEvent] = useState({
        id: "",
        name: "",
        startDate: "",
        endDate: "",
        earliestTime: "",
        latestTime: "",
        length: 0,
        numOfParticipants: -1,
        autoCreate: false,
        finilized: false,
        user: [],
        busyTimes: [("", "")]
    });

    const [viewType, setViewType] = useState("timeGridWeek");

    // const [data, setData] = useState({
    //     name: "",
    //     age: 0,
    //     date: "",
    //     programming: "",
    // });

    // Manually setting user's events
    const [eventsList, setEventsList] = useState([
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
    ])

    // Fetch data from database
    //   useEffect(() => {
    //     console.log("Backend URL:", process.env.NEXT_PUBLIC_BACKEND_URL);
    //     fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/data`).then((response) => {
    //       if (!response.ok) {
    //         throw new Error(`HTTP error! Status: ${response.status}`);
    //       }
    //       console.log(response);
    //       response.json().then((data) => {

    //         console.log(data);
    //         setData({
    //           name: data.Name,
    //           age: data.Age,
    //           date: data.Date,
    //           programming: data.programming,
    //         });  
    //       })
    //       .catch((error) => console.error("Error fetching data:", error));});
    //   }, []);

    // Manually setting event's start-end range
    useEffect(() => {
        setEvent(() => ({
            id: "1",
            startDate: "2025-01-10",
            endDate: "2025-01-18",
        }));
    }, []);

    const [visibleRange, setVisibleRange] = useState(null);

    useEffect(() => {
        // console.log(`hello ${event.startDate}`)
        if (event.startDate && event.endDate) {
            const start = new Date(event.startDate);
            const end = new Date(event.endDate);

            const differenceInMilliseconds = end - start;
            const differenceInDays = differenceInMilliseconds / 1000 / 60 / 60 / 24

            setVisibleRange({
                start: start.toISOString(), // Convert to ISO string for FullCalendar
                end: end.toISOString(),
            });

            if (differenceInDays <= 7) {
                setViewType("timeGridWeek");
            } else if (differenceInDays <= daysInThisMonth()) {
                setViewType("dayGridMonth");
            } else {
                setViewType("multiMonthYear");
            }

            console.log(`Start Date: ${event.startDate}, End Date: ${event.endDate}`);
            console.log(`Difference in Days: ${differenceInDays}`);
        }
    }, [event.startDate, event.endDate]);

    return (
        <div className={styles.page}>
            <main className={styles.main}>
                <div id="calendar"></div>
                <FullCalendar
                    plugins={[timeGridPlugin, dayGridPlugin, multiMonthPlugin]}
                    initialView={viewType} // Dynamically set the view type
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
                    // views={

                    // }
                    showNonCurrentDates={false}
                    // initialDate='2025-02-08'
                    // visibleRange={{
                    //     start: '2025-01-10',
                    //     end: '2025-01-18',
                    // }}
                    // visibleRange={visibleRange}
                    events={eventsList} // Pass events
                    height="auto" // Adjust height dynamically
                />
            </main>
        </div>
    );
}





// Old code. Refrence for getting data from backend //
function Home() {
    const [event, setEvent] = useState({
        id: "",
        name: "",
        startDate: Date,
        endDate: Date,
        earliestTime: "",
        latestTime: "",
        length: 0,
        numOfParticipants: -1,
        autoCreate: false,
        finilized: false,
        user: [],
        busyTimes: [("", "")]
    });

    const [viewType, setViewType] = useState("week");

    // const [data, setData] = useState({
    //     name: "",
    //     age: 0,
    //     date: "",
    //     programming: "",
    // });

    // Fetch data
    // useEffect(() => {
    //   console.log("Backend URL:", process.env.NEXT_PUBLIC_BACKEND_URL);
    //   fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/data`).then((response) => {
    //     if (!response.ok) {
    //       throw new Error(`HTTP error! Status: ${response.status}`);
    //     }
    //     console.log(response);
    //     response.json().then((data) => {

    //       console.log(data);
    //       setData({
    //         name: data.Name,
    //         age: data.Age,
    //         date: data.Date,
    //         programming: data.programming,
    //       });  
    //     })
    //     .catch((error) => console.error("Error fetching data:", error));});
    // }, []);

    // Fetch Event data
    // useEffect(() => {
    //   console.log("Backend URL:", process.env.NEXT_PUBLIC_BACKEND_URL);
    //   fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/events`).then((response) => {
    //     if (!response.ok) {
    //       throw new Error(`HTTP error! Status: ${response.status}`);
    //     }
    //     console.log(response);
    //     response.json().then((event) => {

    //       console.log(event);
    //       setEvent ({
    //         // startDate: event.startDate,
    //         // endDate: event.endDate
    //         startDate: "2024-12-01T00:00:00",
    //         endDate: "2024-12-07T00:00:00"
    //       })
    //     })
    //     .catch((error) => console.error("Error fetching data:", error));});
    // }, []);

    useEffect(() => {
        console.log(event);
        setEvent({
            // startDate: event.startDate,
            // endDate: event.endDate
            startDate: "2024-12-01T00:00:00",
            endDate: "2024-12-09T00:00:00"
        })
    }
        , []);

    useEffect(() => {
        if (event.startDate && event.endDate) {
            const start = new Date(event.startDate).getTime();
            const end = new Date(event.endDate).getTime();

            const differenceInMilliseconds = end - start;
            const differenceInDays = differenceInMilliseconds / 1000 / 60 / 60 / 24

            if (differenceInDays < 7) {
                setViewType("week");
            } else if (differenceInDays < 31) {
                setViewType("month");
            } else {
                setViewType("multiMonth");
            }

            console.log(`Start Date: ${event.startDate}, End Date: ${event.endDate}`);
            console.log(`Difference in Days: ${differenceInDays}`);
        }
    }, [event.startDate, event.endDate]);

    // Initialize FullCalendar
    useEffect(() => {
        const calendarEl = document.getElementById("calendar");
        if (calendarEl) {
            let calendar;
            if (viewType === "week") {
                calendar = new Calendar(calendarEl, {
                    plugins: [timeGridPlugin],
                    initialView: "timeGridWeek",
                    headerToolbar: { left: "prev,next", center: "title", right: "timeGridWeek,timeGridDay" },

                    // need to replace this with busy/free times (depends if we 
                    // want to show the users the free times or busy times)
                    events: [
                        { title: "Meeting", start: "2024-12-02T10:00:00", end: "2024-12-02T12:00:00" },
                    ],
                });
            } else if (viewType === "month") {
                calendar = new Calendar(calendarEl, {
                    plugins: [dayGridPlugin],
                    initialView: "dayGridMonth",
                    // need to replace this with busy/free times (depends if we 
                    // want to show the users the free times or busy times)
                    events: [{ title: "Holiday", start: "2024-12-20", end: "2024-12-25" }],
                });
            } else if (viewType === "multiMonth") {
                calendar = new Calendar(calendarEl, {
                    plugins: [multiMonthPlugin],
                    initialView: "multiMonthYear",
                    multiMonthMaxColumns: 1,
                    // need to replace this with busy/free times (depends if we 
                    // want to show the users the free times or busy times)
                    events: [{ title: "Project Deadline", start: "2024-12-05" }],
                });
            }
            calendar.render();
        }
    }, [viewType]);
    return (
        <div className="container">
            <div className="auto_create">auto create</div>
            <div className="i1">
                <div className="calendar">
                    <h2>
                        {viewType === "week"
                            ? "Week/Day View"
                            : viewType === "month"
                                ? "Month View"
                                : "Multi-Month View"}
                    </h2>
                    <div id="calendar"></div>
                </div>
                <div className="user_list">user list</div>
                <div className="preferences">preferences</div>
            </div>
            <div className="copy_link">copy link</div>
        </div>
    );
}

export default Event;