import React from "react";
import { useCalendarConnection } from "../../hooks/useCalendarConnection";
import CalendarConnectPrompt from "./CalendarConnectPrompt";
import { Button } from "../common/Button";
import { clearCalendarConnectionData, getCalendarConnectionData } from "../../utils/calendarConnection";

/**
 * Demo component to test calendar connection flow
 * This can be used for testing and development
 */
const CalendarConnectionDemo = () => {
  const {
    needsCalendarPrompt,
    calendarPromptContext,
    hasGoogleCalendar,
    shouldShowCalendarPrompt,
    showCalendarPrompt,
    hideCalendarPrompt,
    connectGoogleCalendar,
    handleCalendarConnected,
    handleSkipCalendar
  } = useCalendarConnection();

  const handleConnectCalendar = async () => {
    try {
      await connectGoogleCalendar();
      handleCalendarConnected();
    } catch (error) {
      console.error('Failed to connect calendar:', error);
    }
  };

  const handleSkipCalendarConnection = () => {
    handleSkipCalendar();
  };

  const handleResetDemo = () => {
    clearCalendarConnectionData();
    window.location.reload();
  };

  const connectionData = getCalendarConnectionData();

  return (
    <div className="calendar-connection-demo">
      <h2>Calendar Connection Demo</h2>
      
      <div className="demo-info">
        <p><strong>Has Google Calendar:</strong> {hasGoogleCalendar() ? 'Yes' : 'No'}</p>
        <p><strong>Should show prompt (create):</strong> {shouldShowCalendarPrompt('create') ? 'Yes' : 'No'}</p>
        <p><strong>Should show prompt (view):</strong> {shouldShowCalendarPrompt('view') ? 'Yes' : 'No'}</p>
        <p><strong>Needs prompt:</strong> {needsCalendarPrompt ? 'Yes' : 'No'}</p>
        <p><strong>Context:</strong> {calendarPromptContext || 'None'}</p>
      </div>

      <div className="demo-actions">
        <Button onClick={() => showCalendarPrompt('create')}>
          Show Create Prompt
        </Button>
        <Button onClick={() => showCalendarPrompt('view')}>
          Show View Prompt
        </Button>
        <Button onClick={handleResetDemo}>
          Reset Demo
        </Button>
      </div>

      <div className="demo-data">
        <h3>Local Storage Data:</h3>
        <pre>{JSON.stringify(connectionData, null, 2)}</pre>
      </div>

      {/* Calendar Connect Prompt */}
      <CalendarConnectPrompt
        context={calendarPromptContext}
        onConnect={handleConnectCalendar}
        onSkip={handleSkipCalendarConnection}
        onClose={hideCalendarPrompt}
        isVisible={needsCalendarPrompt}
      />
    </div>
  );
};

export default CalendarConnectionDemo;
