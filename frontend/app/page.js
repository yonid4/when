"use client";

// import styles from "./page.module.css";
import React, { useState } from "react";
import './App.css';
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function Landing() {
  const [startHour, setStartHour] = useState("");
  const [startMinute, setStartMinute] = useState("");
  const [endHour, setEndHour] = useState("");
  const [endMinute, setEndMinute] = useState("");
  const [lengthHours, setLengthHours] = useState("");
  const [lengthMinutes, setLengthMinutes] = useState("");
  // State for event's date range
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;

  // Options arrays
  const hourOptions = Array.from({ length: 24 }, (_, i) => ({
    value: i,
    display: `${i % 12 === 0 ? 12 : i % 12} ${i < 12 ? 'AM' : 'PM'}`,
  }));

  const minuteOptions = Array.from({ length: 7 }, (_, i) => ({
    display: `${i * 10} minutes`,
  }));

  const hoursCount = Array.from({ length: 30 }, (_, i) => i + 1);

  const handleSubmit = (event) => {
    event.preventDefault();

    const formData = {
      eventName: event.target.eventName.value,
      eventStartDate: startDate ? format(startDate, 'yyyy-MM-dd') : '',
      eventEndDate: endDate ? format(endDate, 'yyyy-MM-dd') : '',
      startTime: `${startHour}:${startMinute}`,
      endTime: `${endHour}:${endMinute}`,
      eventLength: `${lengthHours}:${lengthMinutes}`,
      participantsCount: event.target.participantsCount.value,
    };

    // Updated validation
    if (
      !formData.eventName ||
      !startDate ||
      !endDate ||
      !startHour ||
      !startMinute ||
      !endHour ||
      !endMinute ||
      !formData.eventLength
    ) {
      alert("Please fill out all required fields!");
      return;
    }

    console.log("Form Data:", formData);
  }

  return (
    <>
      <div className="center">
        <form onSubmit={handleSubmit}>
          <div class="form-group">
            <label htmlFor="eventName">Event Name:</label>
            <input type="text" id="eventName" name="eventname" placeholder="Event name.." style={{ color: "white" }}></input>
          </div>

          {/* <div></div> */}
          <div class="form-group">
            <label>Event Date Range:</label>
            <DatePicker
              selected={startDate}
              onChange={(update) => setDateRange(update)}
              startDate={startDate}
              endDate={endDate}
              selectsRange
              isClearable={true}
              dateFormat="MMMM d, yyyy"
              className="react-datepicker-input"
              placeholderText="Pick a date range"
            />
          </div>

          <div class="form-group">
            <label for="eventStartTime">No Earlier Than:</label>
            <div id="eventStartTime" style={{ display: "flex", width: "300px", gap: "5px", alignItems: "center" }}>
              {/* Hour Dropdown for Event Start Time */}
              <select id="startHour" name="startHour" value={startHour} onChange={(e) => setStartHour(e.target.value)} style={{ fontSize: "12px" }}>
                <option value="" disabled>
                  Select Hour
                </option>
                {hourOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.display}
                  </option>
                ))}
              </select>

              {/* Minute Dropdown for Event Start Time */}
              <select id="startMinute" name="startMinute" value={startMinute} onChange={(e) => setStartMinute(e.target.value)} style={{ fontSize: "12px" }}>
                <option value="" disabled>
                  Select Minutes
                </option>
                {minuteOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.display}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="eventEndTime">No Earlier Than:</label>
            <div id="eventEndTime" style={{ display: "flex", width: "300px", gap: "5px", alignItems: "center" }}>
              {/* Hour Dropdown for Event End Time */}
              <select id="endHour" name="endHour" value={endHour} onChange={(e) => setEndHour(e.target.value)} style={{ fontSize: "12px" }}>
                <option value="" disabled>
                  Select Hour
                </option>
                {hourOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.display}
                  </option>
                ))}
              </select>

              {/* Minutes Dropdown for Evenet End Time */}
              <select id="endMinute" name="endMinute" value={endMinute} onChange={(e) => setEndMinute(e.target.value)} style={{ fontSize: "12px" }}>
                <option value="" disabled>
                  Select Minutes
                </option>
                {minuteOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.display}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div class="form-group">
            {/* Event Length label & input */}
            <label for="eventLength">Estimated  Event Length</label>
            <div id="eventLength" style={{ display: "flex", width: "300px", gap: "5px", alignItems: "center" }}>
              {/* Hour Dropdown for Event Length */}
              <select id="lengthHours" name="lengthHours" value={lengthHours} onChange={(e) => setLengthHours(e.target.value)} style={{ fontSize: "12px" }}>
                <option value="" disabled>
                  Select Hours
                </option>
                {hoursCount.map(hour => (
                  <option key={hour} value={hour}>
                    {hour}
                  </option>
                ))}
              </select>

              {/* Minute Dropdown for Event Length */}
              <select id="lengthMinutes" name="lengthMinutes" value={lengthMinutes} onChange={(e) => setLengthMinutes(e.target.value)} style={{ fontSize: "12px" }}>
                <option value="" disabled>
                  Select Minutes
                </option>
                {minuteOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.display}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div class="form-group">
            {/* Number of Participants label & input */}
            <label for="participantsCount">No. of participants:</label>
            <input type="number" id="participantsCount" name="participantscount" placeholder="Number of Participants.."></input>
          </div>

          <div></div>

          <button type="submit">Create Event</button>
        </form>
      </div>
    </>
  )
}

export default Landing;