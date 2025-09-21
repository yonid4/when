import React from "react";

const UserList = ({ participants, onUserSelect }) => {
  return (
    <div className="h-full w-full p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Participants</h2>
      <div className="space-y-2">
        {participants?.map((participant) => (
          <div
            key={participant.id}
            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
            onClick={() => onUserSelect(participant)}
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                {participant.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-medium">{participant.name}</p>
                <p className="text-sm text-gray-500">{participant.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  participant.available ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-sm text-gray-500">
                {participant.available ? "Available" : "Unavailable"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserList; 