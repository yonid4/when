import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Box } from "@chakra-ui/react";
import Layout from "./layout";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import EventPage from "./pages/EventPage";
import ProtectedRoute from "./components/ProtectedRoute";

// New redesigned pages
import Landing from "./pages/Landing";
import DashboardTemp from "./pages/DashboardTemp";
import EventTemp from "./pages/EventTemp";
import EventCreate from "./pages/EventCreate";

const App = () => (
  <Box minH="100vh" bg="gray.50" w="100%">
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/events/:eventUid" element={<EventPage />} />
          
          {/* New redesigned routes */}
          <Route path="/landing" element={<Landing />} />
          <Route path="/dashboard_temp" element={<DashboardTemp />} />
          <Route path="/event_temp/:eventId" element={<EventTemp />} />
          <Route path="/event/create" element={<EventCreate />} />
          
          {/* Add more protected routes as needed */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  </Box>
);

export default App;
