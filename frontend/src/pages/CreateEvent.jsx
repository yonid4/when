import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCalendarConnection } from "../hooks/useCalendarConnection";
import CalendarConnectPrompt from "../components/calendar/CalendarConnectPrompt";
import { Button } from "../components/common/Button";
import "../styles/calendar.css";

const CreateEvent = () => {
  const navigate = useNavigate();
  const {
    needsCalendarPrompt,
    calendarPromptContext,
    shouldShowCalendarPrompt,
    showCalendarPrompt,
    hideCalendarPrompt,
    connectGoogleCalendar,
    handleCalendarConnected,
    handleSkipCalendar,
    markFirstEventCreation
  } = useCalendarConnection();

  const [eventData, setEventData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    location: ""
  });

  const [isCreating, setIsCreating] = useState(false);

  // Check if calendar prompt should be shown when component mounts
  useEffect(() => {
    if (shouldShowCalendarPrompt('create')) {
      showCalendarPrompt('create');
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEventData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateEvent = async () => {
    // Check if calendar prompt should be shown
    if (shouldShowCalendarPrompt('create')) {
      showCalendarPrompt('create');
      return;
    }

    // Proceed with event creation
    await createEvent();
  };

  const createEvent = async () => {
    setIsCreating(true);
    try {
      // TODO: Implement actual event creation API call
      console.log('Creating event:', eventData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to event page or dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to create event:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleConnectCalendar = async () => {
    try {
      await connectGoogleCalendar();
      handleCalendarConnected();
    } catch (error) {
      console.error('Failed to connect calendar:', error);
    }
  };

  const onSkipCalendar = () => {
    handleSkipCalendar();
    // Continue with event creation
    createEvent();
  };

  return (
    <div className="create-event-page">
      <h1>Create New Event</h1>
      
      <form className="event-form">
        <div className="form-group">
          <label htmlFor="title">Event Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={eventData.title}
            onChange={handleInputChange}
            placeholder="Enter event title"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={eventData.description}
            onChange={handleInputChange}
            placeholder="Enter event description"
            rows="4"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="startDate">Start Date</label>
            <input
              type="datetime-local"
              id="startDate"
              name="startDate"
              value={eventData.startDate}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="endDate">End Date</label>
            <input
              type="datetime-local"
              id="endDate"
              name="endDate"
              value={eventData.endDate}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="location">Location</label>
          <input
            type="text"
            id="location"
            name="location"
            value={eventData.location}
            onChange={handleInputChange}
            placeholder="Enter event location"
          />
        </div>

        <div className="form-actions">
          <Button
            type="button"
            onClick={handleCreateEvent}
            disabled={isCreating}
            className="primary"
          >
            {isCreating ? "Creating..." : "Create Event"}
          </Button>
        </div>
      </form>

      {/* Calendar Connect Prompt */}
      <CalendarConnectPrompt
        context={calendarPromptContext}
        onConnect={handleConnectCalendar}
        onSkip={onSkipCalendar}
        onClose={hideCalendarPrompt}
        isVisible={needsCalendarPrompt}
      />
    </div>
  );
};

export default CreateEvent;
