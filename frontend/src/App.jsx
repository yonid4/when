import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Box } from "@chakra-ui/react";
import Layout from "./layout";
import { ProtectedRoute } from "./components/auth";

import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import EventPage from "./pages/EventPage";
import EventCreate from "./pages/EventCreate";

const App = () => (
  <Box minH="100vh" bg="gray.50" w="100%">
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Landing />} />
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
          <Route
            path="/event/create"
            element={
              <ProtectedRoute>
                <EventCreate />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  </Box>
);

export default App;
