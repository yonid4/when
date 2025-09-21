import React from "react";

const Preferences = ({ preferences, onPreferenceChange }) => {
  return (
    <div className="h-full w-full p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Event Preferences</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duration
          </label>
          <select
            className="w-full p-2 border rounded-md"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Time Zone
          </label>
          <select
            className="w-full p-2 border rounded-md"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Meeting Type
          </label>
          <select
            className="w-full p-2 border rounded-md"
            value={preferences?.meetingType}
            onChange={(e) => onPreferenceChange("meetingType", e.target.value)}
          >
            <option value="in-person">In Person</option>
            <option value="virtual">Virtual</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reminder
          </label>
          <select
            className="w-full p-2 border rounded-md"
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