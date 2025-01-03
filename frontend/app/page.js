"use client";

// import styles from "./page.module.css";
import React, { useState } from "react";
import './App.css';
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function Landing() {
  const [startHour, setStartHour] = useState("");
  const [startMinute, setStartMinute] = useState("");
  const [endHour, setEndHour] = useState("");
  const [endMinute, setEndMinute] = useState("");
  const [lengthHours, setLengthHours] = useState("");
  const [lengthMinutes, setLengthMinutes] = useState("");
  // Add new state for date range
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;

  // Options arrays...
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
      <div className="header" style={{ color: "blue" }}>when.</div>

      <div className="center">
        <form onSubmit={handleSubmit}>
          <label htmlFor="eventName">Event Name:</label>
          <input type="text" id="eventName" name="eventname" placeholder="Event name.." style={{ color: "white" }}></input>

          <label>Event Date Range:</label>
          <div></div>
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
          <div></div>

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

          {/* Number of Participants label & input */}
          <label for="participantsCount">No. of participants:</label>
          <input type="number" id="participantsCount" name="participantscount" placeholder="Number of Participants.." style={{ height: "30px", width: "180px", fontSize: "15px", color: "white" }}></input>

          <button type="submit" style={{ fontSize: "30px", display: "flex", position: "absolute", right: "47.5%" }}>Create Event</button>
        </form>
      </div>
    </>
  )
}



// "use client";

// // import styles from "./page.module.css";
// import React, { useState, useEffect } from "react";
// import '../App.css';
// import { format } from "date-fns";
// import { Calendar } from "@/components/ui/calendar";
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// import { Button } from "@/components/ui/button";
// import { CalendarIcon } from "lucide-react";

// export default function Landing() {
//   const [startHour, setStartHour] = useState("");
//   const [startMinute, setStartMinute] = useState("");
//   const [endHour, setEndHour] = useState("");
//   const [endMinute, setEndMinute] = useState("");
//   const [lengthHours, setLengthHours] = useState("");
//   const [lengthMinutes, setLengthMinutes] = useState("");
//   // Add new state for date range
//   const [dateRange, setDateRange] = useState({
//     from: undefined,
//     to: undefined,
//   });

//   // Your existing options arrays...
//   const hourOptions = Array.from({ length: 24 }, (_, i) => ({
//     value: i,
//     display: `${i % 12 === 0 ? 12 : i % 12} ${i < 12 ? 'AM' : 'PM'}`,
//   }));

//   const minuteOptions = Array.from({ length: 6 }, (_, i) => ({
//     value: i * 10,
//     display: `${(i * 10).toString().padStart(2, '0')}`,
//   }));

//   const hoursCount = Array.from({ length: 30 }, (_, i) => i + 1);

//   const handleSubmit = (event) => {
//     event.preventDefault();

//     const formData = {
//       eventName: event.target.eventName.value,
//       eventStartDate: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : '',
//       eventEndDate: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : '',
//       startTime: `${startHour}:${startMinute}`,
//       endTime: `${endHour}:${endMinute}`,
//       eventLength: `${lengthHours}:${lengthMinutes}`,
//       participantsCount: event.target.participantsCount.value,
//     };

//     // Updated validation
//     if (
//       !formData.eventName ||
//       !dateRange.from ||
//       !dateRange.to ||
//       !startHour ||
//       !startMinute ||
//       !endHour ||
//       !endMinute ||
//       !formData.eventLength
//     ) {
//       alert("Please fill out all required fields!");
//       return;
//     }

//     console.log("Form Data:", formData);
//   }

//   return (
//     <>
//       <div className="header" style={{ color: "blue" }}>when.</div>

//       <div className="center">
//         <form onSubmit={handleSubmit}>
//           <label htmlFor="eventName">Event Name:</label>
//           <input type="text" id="eventName" name="eventname" placeholder="Event name.." style={{ color: "white" }}></input>

//           {/* Replace the two date inputs with this date range picker */}
//           <label>Event Date Range:</label>
//           <Popover>
//             <PopoverTrigger asChild>
//               <Button variant="outline" className="w-[300px] justify-start text-left font-normal">
//                 <CalendarIcon className="mr-2 h-4 w-4" />
//                 {dateRange.from ? (
//                   dateRange.to ? (
//                     <>
//                       {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
//                     </>
//                   ) : (
//                     format(dateRange.from, "LLL dd, y")
//                   )
//                 ) : (
//                   <span>Pick a date range</span>
//                 )}
//               </Button>
//             </PopoverTrigger>
//             <PopoverContent className="w-auto p-0" align="start">
//               <Calendar
//                 initialFocus
//                 mode="range"
//                 defaultMonth={dateRange.from}
//                 selected={dateRange}
//                 onSelect={setDateRange}
//                 numberOfMonths={2}
//               />
//             </PopoverContent>
//           </Popover>

//           <label for="eventStartTime">No Earlier Than:</label>
//           <div id="eventStartTime" style={{ display: "flex", width: "300px", gap: "5px", alignItems: "center" }}>
//             {/* Hour Dropdown for Event Start Time */}
//             <select id="startHour" name="startHour" value={startHour} onChange={(e) => setStartHour(e.target.value)} style={{ fontSize: "12px" }}>
//               <option value="" disabled>
//                 Select Hour
//               </option>
//               {hourOptions.map(option => (
//                 <option key={option.value} value={option.value}>
//                   {option.display}
//                 </option>
//               ))}
//             </select>

//             {/* Minute Dropdown for Event Start Time */}
//             <select id="startMinute" name="startMinute" value={startMinute} onChange={(e) => setStartMinute(e.target.value)} style={{ fontSize: "12px" }}>
//               <option value="" disabled>
//                 Select Minutes
//               </option>
//               {minuteOptions.map(option => (
//                 <option key={option.value} value={option.value}>
//                   {option.display}
//                 </option>
//               ))}
//             </select>
//           </div>

//           <label for="eventEndTime">No Earlier Than:</label>
//           <div id="eventEndTime" style={{ display: "flex", width: "300px", gap: "5px", alignItems: "center" }}>
//             {/* Hour Dropdown for Event End Time */}
//             <select id="endHour" name="endHour" value={endHour} onChange={(e) => setEndHour(e.target.value)} style={{ fontSize: "12px" }}>
//               <option value="" disabled>
//                 Select Hour
//               </option>
//               {hourOptions.map(option => (
//                 <option key={option.value} value={option.value}>
//                   {option.display}
//                 </option>
//               ))}
//             </select>

//             {/* Minutes Dropdown for Evenet End Time */}
//             <select id="endMinute" name="endMinute" value={endMinute} onChange={(e) => setEndMinute(e.target.value)} style={{ fontSize: "12px" }}>
//               <option value="" disabled>
//                 Select Minutes
//               </option>
//               {minuteOptions.map(option => (
//                 <option key={option.value} value={option.value}>
//                   {option.display}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* Event Length label & input */}
//           <label for="eventLength">Estimated  Event Length</label>
//           <div id="eventLength" style={{ display: "flex", width: "300px", gap: "5px", alignItems: "center" }}>
//             {/* Hour Dropdown for Event Length */}
//             <select id="lengthHours" name="lengthHours" value={lengthHours} onChange={(e) => setLengthHours(e.target.value)} style={{ fontSize: "12px" }}>
//               <option value="" disabled>
//                 Select Hours
//               </option>
//               {hoursCount.map(hour => (
//                 <option key={hour} value={hour}>
//                   {hour}
//                 </option>
//               ))}
//             </select>

//             {/* Minute Dropdown for Event Length */}
//             <select id="lengthMinutes" name="lengthMinutes" value={lengthMinutes} onChange={(e) => setLengthMinutes(e.target.value)} style={{ fontSize: "12px" }}>
//               <option value="" disabled>
//                 Select Minutes
//               </option>
//               {minuteOptions.map(option => (
//                 <option key={option.value} value={option.value}>
//                   {option.display}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* Number of Participants label & input */}
//           <label for="participantsCount">No. of participants:</label>
//           <input type="number" id="participantsCount" name="participantscount" placeholder="Number of Participants.." style={{ height: "30px", width: "180px", fontSize: "15px", color: "white" }}></input>

//           <button type="submit" style={{ fontSize: "30px", display: "flex", position: "absolute", right: "47.5%" }}>Create Event</button>
//         </form>
//       </div>
//     </>
//   )
// }