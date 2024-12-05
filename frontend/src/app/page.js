"use client";

import Image from "next/image";
import styles from "./page.module.css";
import React, { useState, useEffect } from "react";

import { Calendar } from '@fullcalendar/core'
import multiMonthPlugin from '@fullcalendar/multimonth'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'



export default function Home() {

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

  useEffect(() => {
    // Initialize Multi-Month Calendar
    const multiMonthEl = document.getElementById("multiMonthCalendar");
    if (multiMonthEl) {
      const calendarMultiMonth = new Calendar(multiMonthEl, {
        plugins: [multiMonthPlugin],
        initialView: "multiMonthYear",
        multiMonthMaxColumns: 1,
        events: [
          { title: "Project Deadline", start: "2024-12-05" },
          { title: "Team Meeting", start: "2024-12-10" },
        ],
      });
      calendarMultiMonth.render();
    }

    // Initialize Month Calendar
    const monthEl = document.getElementById("monthCalendar");
    if (monthEl) {
      const calendarMonth = new Calendar(monthEl, {
        plugins: [dayGridPlugin],
        initialView: "dayGridMonth",
        events: [
          { title: "Holiday", start: "2024-12-20", end: "2024-12-25" },
          { title: "Workshop", start: "2024-12-15" },
        ],
      });
      calendarMonth.render();
    }

    // Initialize Week/Day Calendar
    const weekEl = document.getElementById("weekCalendar");
    if (weekEl) {
      const calendarWeek = new Calendar(weekEl, {
        plugins: [timeGridPlugin],
        initialView: "timeGridWeek",
        headerToolbar: {
          left: "prev,next",
          center: "title",
          right: "timeGridWeek,timeGridDay",
        },
        events: [
          { title: "Client Meeting", start: "2024-12-08T10:00:00", end: "2024-12-08T12:00:00" },
          { title: "Code Review", start: "2024-12-09T14:00:00", end: "2024-12-09T15:00:00" },
        ],
      });
      calendarWeek.render();
    }
  }, []);

  return (
    <div className={styles.page}>
      <main className={styles.main}>

        <div>
          <h2>Multi-Month View</h2>
          <div id="multiMonthCalendar" style={{ maxWidth: "900px", marginBottom: "20px" }}></div>
        </div>

        <div>
          <h2>Month View</h2>
          <div id="monthCalendar" style={{ maxWidth: "900px", marginBottom: "20px" }}></div>
        </div>

        <div>
          <h2>Week/Day View</h2>
          <div id="weekCalendar" style={{ maxWidth: "900px" }}></div>
        </div>

        <div className="App">
            <header className="App-header">
                <h1>React and flask data</h1>
                <p>{data.name}</p>
                <p>{data.age}</p>
                <p>{data.date}</p>
                <p>{data.programming}</p>

            </header>
        </div>
      </main>
    </div>
  );
}
