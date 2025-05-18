'use client';

import styles from "../page.module.css";
import validator from 'validator';
import { useState, useEffect } from 'react';
import { Suspense } from 'react';
// import FullCalendar from '@fullcalendar/react';

import { CalendarSkeleton } from "../Skeletons";
import Calendar from "../components/Calendar"
import CalendarWrapper from "../components/Calendar";

import '../Calendar.css';

function Event() {
    const [emails, setEmails] = useState([]);
    const [emailInput, setEmailInput] = useState('');
    const [emailError, setEmailError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setEmailError(''); // Clear any previous errors

        if (!emailInput) {
            setEmailError('Please enter an email address');
            return;
        }

        if (!validator.isEmail(emailInput)) {
            setEmailError('Please enter a valid email address');
            return;
        }

        if (emails.includes(emailInput)) {
            setEmailError('This email is already in the list');
            return;
        }

        setEmails([...emails, emailInput]);
        setEmailInput(''); // Clear the input
    };

    return (
        <>
            <div className="eventGrid">
                <div className="auto_create">auto create</div>
                <div className="i1">
                    <div className="calendar">
                        <Suspense fallback={<CalendarSkeleton />}>
                            <CalendarWrapper />
                        </Suspense>
                    </div>
                    <div className="user_list">
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="newEmail">User list:</label>
                                <input 
                                    type="email" 
                                    id="newemail" 
                                    name="newemail" 
                                    placeholder="user@gmail.com"
                                    value={emailInput}
                                    onChange={(e) => setEmailInput(e.target.value)}
                                />
                                <button type="submit">Add</button>
                                {emailError && (
                                    <div style={{ color: 'red', fontSize: '0.8em', marginTop: '5px' }}>
                                        {emailError}
                                    </div>
                                )}
                            </div>
                        </form>
                        <div className="email-list">
                            {emails.map((email, index) => (
                                <div key={index} className="email-item">
                                    {email}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="preferences">preferences</div>
                </div>
                <div className="copy_link">copy link</div>
            </div>
        </>
    )
};

export default Event;