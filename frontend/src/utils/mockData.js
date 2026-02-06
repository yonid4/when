/**
 * Mock data for When Application UI
 * Used for redesigned pages to showcase the new UI
 */

export const mockUsers = [
  {
    id: 1,
    name: "Sarah Chen",
    email: "sarah.chen@example.com",
    avatar: "https://i.pravatar.cc/150?img=1",
    timezone: "America/New_York"
  },
  {
    id: 2,
    name: "John Doe",
    email: "john.doe@example.com",
    avatar: "https://i.pravatar.cc/150?img=13",
    timezone: "America/Los_Angeles"
  },
  {
    id: 3,
    name: "Maria Garcia",
    email: "maria.garcia@example.com",
    avatar: "https://i.pravatar.cc/150?img=5",
    timezone: "Europe/Madrid"
  },
  {
    id: 4,
    name: "Alex Kim",
    email: "alex.kim@example.com",
    avatar: "https://i.pravatar.cc/150?img=14",
    timezone: "Asia/Seoul"
  },
  {
    id: 5,
    name: "Emma Wilson",
    email: "emma.wilson@example.com",
    avatar: "https://i.pravatar.cc/150?img=9",
    timezone: "Europe/London"
  },
  {
    id: 6,
    name: "David Park",
    email: "david.park@example.com",
    avatar: "https://i.pravatar.cc/150?img=12",
    timezone: "America/Chicago"
  },
  {
    id: 7,
    name: "Sophie Martin",
    email: "sophie.martin@example.com",
    avatar: "https://i.pravatar.cc/150?img=10",
    timezone: "Europe/Paris"
  },
  {
    id: 8,
    name: "Michael Brown",
    email: "michael.brown@example.com",
    avatar: "https://i.pravatar.cc/150?img=15",
    timezone: "America/Denver"
  }
];

export const mockEvents = [
  {
    id: 1,
    uid: "evt_001",
    title: "Team Standup",
    description: "Daily team sync to discuss progress and blockers",
    date: "2025-12-02",
    time: "10:00 AM",
    endTime: "10:30 AM",
    duration: 30,
    location: "Zoom",
    locationLink: "https://zoom.us/j/123456789",
    type: "meeting",
    status: "confirmed",
    isVirtual: true,
    host: mockUsers[0],
    participants: [mockUsers[0], mockUsers[1], mockUsers[2], mockUsers[3]],
    rsvps: {
      going: 12,
      maybe: 3,
      declined: 2
    },
    userRsvp: "going",
    attachments: [],
    createdAt: "2025-11-20T10:00:00Z",
    updatedAt: "2025-11-25T15:30:00Z"
  },
  {
    id: 2,
    uid: "evt_002",
    title: "Product Planning Workshop",
    description: "Q1 2025 roadmap planning session with the product team",
    date: "2025-12-05",
    time: "2:00 PM",
    endTime: "4:00 PM",
    duration: 120,
    location: "Conference Room A",
    type: "meeting",
    status: "proposed",
    isVirtual: false,
    host: mockUsers[1],
    participants: [mockUsers[1], mockUsers[0], mockUsers[3], mockUsers[4], mockUsers[5]],
    rsvps: {
      going: 8,
      maybe: 5,
      declined: 1
    },
    userRsvp: "maybe",
    timeOptions: [
      {
        id: "opt_1",
        date: "2025-12-05",
        time: "2:00 PM",
        availableCount: 8,
        totalParticipants: 14,
        participants: [mockUsers[0], mockUsers[1], mockUsers[3]]
      },
      {
        id: "opt_2",
        date: "2025-12-05",
        time: "3:00 PM",
        availableCount: 12,
        totalParticipants: 14,
        participants: [mockUsers[0], mockUsers[1], mockUsers[2], mockUsers[3]]
      },
      {
        id: "opt_3",
        date: "2025-12-06",
        time: "10:00 AM",
        availableCount: 10,
        totalParticipants: 14,
        participants: [mockUsers[1], mockUsers[2], mockUsers[4]]
      }
    ],
    attachments: [
      { id: 1, name: "Q1_Roadmap_Draft.pdf", size: "2.4 MB" }
    ],
    createdAt: "2025-11-22T09:00:00Z",
    updatedAt: "2025-11-26T11:15:00Z"
  },
  {
    id: 3,
    uid: "evt_003",
    title: "Coffee Chat",
    description: "Casual coffee meetup to catch up",
    date: "2025-12-03",
    time: "11:00 AM",
    endTime: "12:00 PM",
    duration: 60,
    location: "Starbucks Downtown",
    type: "social",
    status: "confirmed",
    isVirtual: false,
    host: mockUsers[2],
    participants: [mockUsers[2], mockUsers[0], mockUsers[4]],
    rsvps: {
      going: 3,
      maybe: 0,
      declined: 0
    },
    userRsvp: "going",
    attachments: [],
    createdAt: "2025-11-18T14:30:00Z",
    updatedAt: "2025-11-24T16:00:00Z"
  },
  {
    id: 4,
    uid: "evt_004",
    title: "Birthday Party - Emma",
    description: "Celebrating Emma's 30th birthday! Dress code: Smart casual",
    date: "2025-12-08",
    time: "7:00 PM",
    endTime: "11:00 PM",
    duration: 240,
    location: "The Garden Restaurant, 123 Main St",
    type: "birthday",
    status: "confirmed",
    isVirtual: false,
    host: mockUsers[4],
    participants: [mockUsers[4], mockUsers[0], mockUsers[1], mockUsers[2], mockUsers[3], mockUsers[5], mockUsers[6], mockUsers[7]],
    rsvps: {
      going: 18,
      maybe: 4,
      declined: 2
    },
    userRsvp: "going",
    attachments: [],
    createdAt: "2025-11-15T10:00:00Z",
    updatedAt: "2025-11-27T12:00:00Z"
  },
  {
    id: 5,
    uid: "evt_005",
    title: "Quarterly All-Hands",
    description: "Company-wide Q4 review and Q1 preview",
    date: "2025-12-10",
    time: "9:00 AM",
    endTime: "11:00 AM",
    duration: 120,
    location: "Zoom + Main Auditorium",
    locationLink: "https://zoom.us/j/987654321",
    type: "meeting",
    status: "confirmed",
    isVirtual: true,
    host: mockUsers[5],
    participants: [mockUsers[0], mockUsers[1], mockUsers[2], mockUsers[3], mockUsers[4], mockUsers[5]],
    rsvps: {
      going: 45,
      maybe: 5,
      declined: 3
    },
    userRsvp: "going",
    attachments: [
      { id: 2, name: "Q4_Results.pdf", size: "5.2 MB" },
      { id: 3, name: "Q1_Preview.pptx", size: "8.7 MB" }
    ],
    createdAt: "2025-11-10T08:00:00Z",
    updatedAt: "2025-11-26T09:30:00Z"
  },
  {
    id: 6,
    uid: "evt_006",
    title: "Design Review",
    description: "Review new mobile app designs",
    date: "2025-12-04",
    time: "3:00 PM",
    endTime: "4:00 PM",
    duration: 60,
    location: "Figma",
    locationLink: "https://figma.com/file/abc123",
    type: "meeting",
    status: "proposed",
    isVirtual: true,
    host: mockUsers[6],
    participants: [mockUsers[6], mockUsers[0], mockUsers[2]],
    rsvps: {
      going: 4,
      maybe: 2,
      declined: 0
    },
    userRsvp: "going",
    attachments: [],
    createdAt: "2025-11-23T13:00:00Z",
    updatedAt: "2025-11-25T14:45:00Z"
  },
  {
    id: 7,
    uid: "evt_007",
    title: "Hiking Trip",
    description: "Weekend hiking adventure in the mountains",
    date: "2025-12-14",
    time: "8:00 AM",
    endTime: "5:00 PM",
    duration: 540,
    location: "Mountain Trail Park",
    type: "social",
    status: "proposed",
    isVirtual: false,
    host: mockUsers[3],
    participants: [mockUsers[3], mockUsers[1], mockUsers[4], mockUsers[7]],
    rsvps: {
      going: 6,
      maybe: 3,
      declined: 1
    },
    userRsvp: "maybe",
    attachments: [],
    createdAt: "2025-11-21T16:00:00Z",
    updatedAt: "2025-11-26T18:30:00Z"
  }
];

export const mockInvitations = [
  {
    id: 10,
    uid: "evt_010",
    title: "Client Presentation",
    description: "Final presentation to ABC Corp",
    date: "2025-12-06",
    time: "2:00 PM",
    duration: 90,
    location: "Client Office",
    type: "meeting",
    host: mockUsers[1],
    participantCount: 8,
    status: "pending",
    invitedAt: "2025-11-26T10:00:00Z"
  },
  {
    id: 11,
    uid: "evt_011",
    title: "Team Lunch",
    description: "Celebrating project completion",
    date: "2025-12-07",
    time: "12:30 PM",
    duration: 90,
    location: "Italian Bistro",
    type: "social",
    host: mockUsers[0],
    participantCount: 12,
    status: "pending",
    invitedAt: "2025-11-25T15:30:00Z"
  },
  {
    id: 12,
    uid: "evt_012",
    title: "Code Review Session",
    description: "Review PRs and discuss architecture",
    date: "2025-12-05",
    time: "4:00 PM",
    duration: 60,
    location: "Zoom",
    type: "meeting",
    host: mockUsers[7],
    participantCount: 5,
    status: "pending",
    invitedAt: "2025-11-27T09:00:00Z"
  }
];

export const mockComments = [
  {
    id: 1,
    eventId: 2,
    user: mockUsers[0],
    text: "Looking forward to this! I've prepared some ideas for Q1.",
    timestamp: "2025-11-26T10:30:00Z",
    type: "comment"
  },
  {
    id: 2,
    eventId: 2,
    user: mockUsers[3],
    text: "Can we move this 30 minutes earlier? I have a conflict at 2pm.",
    timestamp: "2025-11-26T11:00:00Z",
    type: "comment"
  },
  {
    id: 3,
    eventId: 2,
    user: mockUsers[1],
    text: "@Alex Kim - Let me check if we can adjust the time!",
    timestamp: "2025-11-26T11:15:00Z",
    type: "comment"
  },
  {
    id: 4,
    eventId: 2,
    user: mockUsers[4],
    text: "Just confirmed my attendance!",
    timestamp: "2025-11-26T14:00:00Z",
    type: "rsvp"
  },
  {
    id: 5,
    eventId: 4,
    user: mockUsers[0],
    text: "So excited! Should I bring anything?",
    timestamp: "2025-11-25T16:00:00Z",
    type: "comment"
  },
  {
    id: 6,
    eventId: 4,
    user: mockUsers[4],
    text: "Just come and have fun! Everything is arranged 🎉",
    timestamp: "2025-11-25T16:30:00Z",
    type: "comment"
  }
];

export const mockCurrentUser = {
  id: 1,
  name: "Sarah Chen",
  email: "sarah.chen@example.com",
  avatar: "https://i.pravatar.cc/150?img=1",
  timezone: "America/New_York",
  notifications: 3,
  preferences: {
    emailNotifications: true,
    pushNotifications: true,
    weekStartsOn: "monday"
  }
};

export const mockStats = {
  eventsThisMonth: 5,
  upcomingEvents: 7,
  pendingInvitations: 3,
  friendsAvailable: 8,
  eventsHosted: 12,
  eventsAttended: 34
};

export function getEventById(id) {
  return mockEvents.find(event => event.id === parseInt(id) || event.uid === id);
}

export function getCommentsByEventId(eventId) {
  return mockComments.filter(comment => comment.eventId === parseInt(eventId));
}

export function getEventsByStatus(status) {
  return mockEvents.filter(event => event.status === status);
}

export function getUpcomingEvents() {
  const today = new Date();
  return mockEvents
    .filter(event => new Date(event.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

export default {
  mockUsers,
  mockEvents,
  mockInvitations,
  mockComments,
  mockCurrentUser,
  mockStats,
  getEventById,
  getCommentsByEventId,
  getEventsByStatus,
  getUpcomingEvents
};

