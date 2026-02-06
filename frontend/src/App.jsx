import { lazy, Suspense } from "react";

import Layout from "./layout.js";
import { ProtectedRoute } from "./components/auth";
import { RouteLoadingFallback } from "./components/common";

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Box } from "@chakra-ui/react";

const Landing = lazy(() => import("./pages/Landing"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const EventPage = lazy(() => import("./pages/EventPage"));
const EventCreate = lazy(() => import("./pages/EventCreate"));
const Settings = lazy(() => import("./pages/Settings"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));

function App() {
  return (
    <Box minH="100vh" bg="gray.50" w="100%">
      <Router>
        <Layout>
          <Suspense fallback={<RouteLoadingFallback />}>
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
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </Layout>
      </Router>
    </Box>
  );
}

export default App;
