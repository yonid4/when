import React from "react";

const selectStyle = {
  border: "1px solid var(--salt-pepper-light-gray)",
  backgroundColor: "var(--salt-pepper-white)",
  color: "var(--salt-pepper-dark)"
};

const labelStyle = { color: "var(--salt-pepper-dark)" };

function PreferenceSelect({ label, value, options, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={labelStyle}>
        {label}
      </label>
      <select
        className="w-full p-2 rounded-md"
        style={selectStyle}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

const DURATION_OPTIONS = [
  { value: "30", label: "30 minutes" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "1.5 hours" },
  { value: "120", label: "2 hours" }
];

const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "UTC" },
  { value: "EST", label: "Eastern Time" },
  { value: "CST", label: "Central Time" },
  { value: "PST", label: "Pacific Time" }
];

const MEETING_TYPE_OPTIONS = [
  { value: "in-person", label: "In Person" },
  { value: "virtual", label: "Virtual" },
  { value: "hybrid", label: "Hybrid" }
];

const REMINDER_OPTIONS = [
  { value: "none", label: "No reminder" },
  { value: "15", label: "15 minutes before" },
  { value: "30", label: "30 minutes before" },
  { value: "60", label: "1 hour before" }
];

const Preferences = ({ preferences, onPreferenceChange }) => {
  return (
    <div
      className="h-full w-full p-4 rounded-lg shadow"
      style={{
        backgroundColor: "var(--salt-pepper-white)",
        color: "var(--salt-pepper-dark)"
      }}
    >
      <h2 className="text-xl font-semibold mb-4" style={labelStyle}>
        Event Preferences
      </h2>
      <div className="space-y-4">
        <PreferenceSelect
          label="Duration"
          value={preferences?.duration}
          options={DURATION_OPTIONS}
          onChange={(value) => onPreferenceChange("duration", value)}
        />
        <PreferenceSelect
          label="Time Zone"
          value={preferences?.timezone}
          options={TIMEZONE_OPTIONS}
          onChange={(value) => onPreferenceChange("timezone", value)}
        />
        <PreferenceSelect
          label="Meeting Type"
          value={preferences?.meetingType}
          options={MEETING_TYPE_OPTIONS}
          onChange={(value) => onPreferenceChange("meetingType", value)}
        />
        <PreferenceSelect
          label="Reminder"
          value={preferences?.reminder}
          options={REMINDER_OPTIONS}
          onChange={(value) => onPreferenceChange("reminder", value)}
        />
      </div>
    </div>
  );
};

export default Preferences;
