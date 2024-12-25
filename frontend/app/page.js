"use client";

import styles from "./page.module.css";
import React, { useState, useEffect } from "react";
import './App.css';

export default function landing() {
    const [startHour, setStartHour] = useState(""); // State for start hour
    const [startMinute, setStartMinute] = useState(""); // State for start minute
    const [endHour, setEndHour] = useState(""); // State for end hour
    const [endMinute, setEndMinute] = useState(""); // State for end minute
    const [lengthHours, setLengthHours] = useState("");
    const [lengthMinutes, setLengthMinutes] = useState("");

    const hourOptions = Array.from({ length: 24 }, (_, i) => ({
        value: i,
        display: `${i % 12 === 0 ? 12 : i % 12} ${i < 12 ? 'AM' : 'PM'}`,
    }));

    const minuteOptions = Array.from({ length: 6 }, (_, i) => ({
        value: i * 10,
        display: `${(i * 10).toString().padStart(2, '0')}`,
    }));

    const hoursCount = Array.from({ length: 30 }, (_, i) => i + 1);

    const handleSubmit = (event) => {
        event.preventDefault(); // Prevents default form submission behavior

        // Get form values
        const formData = {
            eventName: event.target.eventName.value,
            eventStartDate: event.target.eventStartDate.value,
            eventEndDate: event.target.eventEndDate.value,
            startTime: `${startHour}:${startMinute}`,
            endTime: `${endHour}:${endMinute}`,
            eventLength: `${lengthHours}:${lengthMinutes}`,
            // eventLength: event.target.eventLength.value,
            participantsCount: event.target.participantsCount.value,
        };

        // Validation: Ensure required fields are filled
        if (
            !formData.eventName ||
            !formData.eventStartDate ||
            !formData.eventEndDate ||
            !startHour ||
            !startMinute ||
            !endHour ||
            !endMinute ||
            !formData.eventLength
        ) {
            alert("Please fill out all required fields!");
            return;
        }
        
        console.log("Form Data:");
        Object.entries(formData).forEach(([key, value]) => {
            console.log(`${key}:`, value);
        });
    }

    return (
        <>
            {/* <a className="header" href="http://localhost:3000">When.</a> */}
            <div className="header" style={{ color: "blue" }}>When.</div>

            <div className="center">
                <form onSubmit={handleSubmit}>
                    {/* Event Name label & input */}
                    <label for="eventName">Event Name:</label>
                    <input type="text" id="eventName" name="eventname" placeholder="Event name.." style={{ color: "white" }}></input>

                    {/* Event Start Date label & input */}
                    <label for="eventStartDate">Event Start Date:</label>
                    <input type="date" id="eventStartDate" name="eventstardate" style={{ fontSize: "15px", color: "white" }}></input>

                    {/* Event End Date label & input */}
                    <label for="eventEndDate">Event End Date:</label>
                    <input type="date" id="eventEndDate" name="eventenddate" style={{ fontSize: "15px", color: "white" }}></input>

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
                    
                    <label for="eventEndTime">No Earlier Than:</label>
                    <div id="eventEndTime" style={{ display: "flex", width: "300px", gap: "5px", alignItems: "center"}}>
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

                    {/* Event Length label & input */}
                    <label for="eventLength">Estimated  Event Length</label>   
                    <div id="eventLength" style={{ display: "flex", width: "300px", gap: "5px", alignItems: "center"}}>
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

                    {/* Number of Participants label & input */}
                    <label for="participantsCount">No. of participants:</label>
                    <input type="number" id="participantsCount" name="participantscount" placeholder="Number of Participants.." style={{ height: "30px" , width: "180px" ,fontSize: "15px", color: "white" }}></input>
                            
                    <button type="submit" style={{ fontSize: "30px", display: "flex", position: "absolute", right: "47.5%" }}>Create Event</button>
                </form>
            </div>
        </>
    )
}