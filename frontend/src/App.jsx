import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Box } from "@chakra-ui/react";
import Layout from "./layout";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import EventPage from "./pages/EventPage";
import ProtectedRoute from "./components/ProtectedRoute";

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
          {/* Add more protected routes as needed */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  </Box>
);

export default App;
