import React from "react";

const Preferences = ({ preferences, onPreferenceChange }) => {
  return (
    <div className="h-full w-full p-4 rounded-lg shadow" style={{ 
      backgroundColor: "var(--salt-pepper-white)", 
      color: "var(--salt-pepper-dark)" 
    }}>
      <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--salt-pepper-dark)" }}>Event Preferences</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--salt-pepper-dark)" }}>
            Duration
          </label>
          <select
            className="w-full p-2 rounded-md" 
            style={{ 
              border: "1px solid var(--salt-pepper-light-gray)", 
              backgroundColor: "var(--salt-pepper-white)", 
              color: "var(--salt-pepper-dark)" 
            }}
            value={preferences?.duration}
            onChange={(e) => onPreferenceChange("duration", e.target.value)}
          >
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
            <option value="90">1.5 hours</option>
            <option value="120">2 hours</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--salt-pepper-dark)" }}>
            Time Zone
          </label>
          <select
            className="w-full p-2 rounded-md" 
            style={{ 
              border: "1px solid var(--salt-pepper-light-gray)", 
              backgroundColor: "var(--salt-pepper-white)", 
              color: "var(--salt-pepper-dark)" 
            }}
            value={preferences?.timezone}
            onChange={(e) => onPreferenceChange("timezone", e.target.value)}
          >
            <option value="UTC">UTC</option>
            <option value="EST">Eastern Time</option>
            <option value="CST">Central Time</option>
            <option value="PST">Pacific Time</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--salt-pepper-dark)" }}>
            Meeting Type
          </label>
          <select
            className="w-full p-2 rounded-md" 
            style={{ 
              border: "1px solid var(--salt-pepper-light-gray)", 
              backgroundColor: "var(--salt-pepper-white)", 
              color: "var(--salt-pepper-dark)" 
            }}
            value={preferences?.meetingType}
            onChange={(e) => onPreferenceChange("meetingType", e.target.value)}
          >
            <option value="in-person">In Person</option>
            <option value="virtual">Virtual</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "var(--salt-pepper-dark)" }}>
            Reminder
          </label>
          <select
            className="w-full p-2 rounded-md" 
            style={{ 
              border: "1px solid var(--salt-pepper-light-gray)", 
              backgroundColor: "var(--salt-pepper-white)", 
              color: "var(--salt-pepper-dark)" 
            }}
            value={preferences?.reminder}
            onChange={(e) => onPreferenceChange("reminder", e.target.value)}
          >
            <option value="none">No reminder</option>
            <option value="15">15 minutes before</option>
            <option value="30">30 minutes before</option>
            <option value="60">1 hour before</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default Preferences; 