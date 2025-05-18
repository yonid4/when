"use client";

import Image from "next/image";
import styles from "../page.module.css";
import React, { useState, useEffect } from "react";

import { Calendar } from '@fullcalendar/core'
import multiMonthPlugin from '@fullcalendar/multimonth'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import { throwIfDisallowedDynamic } from "next/dist/server/app-render/dynamic-rendering";
import { DaySeriesModel } from "@fullcalendar/core/internal";

// import Calendar from 'react-calendar';

import '../App.css';

// Helper function to clean the escaped dates
function cleanDate(dateString) {
  return dateString.replace(/^\\*"/, "").replace(/\\*"$/, "");
}

function Event() {
  const [event, setEvent] = useState({
    id: "",
    name: "",
    startDate: null,
    endDate: null,
    earliestTime: "",
    latestTime: "",
  });
  const [viewType, setViewType] = useState("week");

  // Fetch event data
  useEffect(() => {
    // console.log("Backend URL:", process.env.NEXT_PUBLIC_BACKEND_URL);
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/test_db`)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return response.json();
      })
      .then((data) => {
        setEvent({
          id: data["Event id"],
          name: data["Event name"],
          startDate: cleanDate(data["Event start date"]),
          endDate: cleanDate(data["Event end date"]),
          earliestTime: cleanDate(data["Event start time"]),
          latestTime: cleanDate(data["Event end time"]),
        });
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  // Determine view type based on event start and end dates
  useEffect(() => {
    if (event.startDate && event.endDate) {
      const start = new Date(event.startDate).getTime();
      const end = new Date(event.endDate).getTime();

      console.log("Start Date:", event.startDate, "End Date:", event.endDate);

      const differenceInDays = (end - start) / (1000 * 60 * 60 * 24);

      if (differenceInDays < 7) setViewType("week");
      else if (differenceInDays < 31) setViewType("month");
      else setViewType("multiMonth");
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
    <>
      <div className="eventGrid">
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
    </>
  );
}

export default Event;


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
    busyTimes: [("","")]
  });

  const [viewType, setViewType] = useState("week");

  const [data, setData] = useState({
    name: "",
    age: 0,
    date: "",
    programming:"",
  });

  useEffect(() => {
    console.log("Backend URL:", process.env.NEXT_PUBLIC_BACKEND_URL);
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/data`).then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      console.log(response);
      response.json().then((data) => {
        
        console.log(data);
        setData({
          name: data.Name,
          age: data.Age,
          date: data.Date,
          programming: data.programming,
        });  
      })
      .catch((error) => console.error("Error fetching data:", error));});
  }, []);

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
      setEvent ({
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
      const differenceInDays = differenceInMilliseconds / 1000 / 60 /60 / 24

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

  useEffect(() => {
    const calendarEl = document.getElementById("calendar");
    if (calendarEl) {
      let calendar;
      if (viewType === "week") {
        // Initialize Week/Day Calendar
        calendar = new Calendar(calendarEl, {
          plugins: [timeGridPlugin],
          initialView: "timeGridWeek",
          headerToolbar: {
            left: "prev,next",
            center: "title",
            right: "timeGridWeek,timeGridDay",
          },
          events: [
            { title: "Client Meeting", start: "2024-12-02T10:00:00", end: "2024-12-02T12:00:00" },
            { title: "Code Review", start: "2024-12-03T14:00:00", end: "2024-12-03T15:00:00" },
          ],
        });
      } else if (viewType === "month") {
        // Initialize Month Calendar
        calendar = new Calendar(calendarEl, {
          plugins: [dayGridPlugin],
          initialView: "dayGridMonth",
          events: [
            { title: "Holiday", start: "2024-12-20", end: "2024-12-25" },
            { title: "Workshop", start: "2024-12-15" },
          ],
        });
      } else if (viewType === "multiMonth") {
        // Initialize Multi-Month Calendar
        calendar = new Calendar(calendarEl, {
          plugins: [multiMonthPlugin],
          initialView: "multiMonthYear",
          multiMonthMaxColumns: 1,
          events: [
            { title: "Project Deadline", start: "2024-12-05" },
            { title: "Team Meeting", start: "2024-12-10" },
          ],
        });
      }
      calendar.render();
    }
  }, [viewType]);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
          <div className="test">
          <h1>React and flask data</h1>
          <p>{data.name}</p>
          <p>{data.age}</p>
          <p>{data.date}</p>
          <p>{data.programming}</p>
        </div>
        <h2>
          {viewType === "week"
            ? "Week/Day View"
            : viewType === "month"
            ? "Month View"
            : "Multi-Month View"}
        </h2>
        <div id="calendar" style={{ maxWidth: "1300px" }}></div>
      </main>
    </div>
  );
}