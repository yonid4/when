import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Box, Flex, Heading } from "@chakra-ui/react";
// import { useAuth } from "./context/AuthContext";
// import Layout from "./layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import EventPage from "./pages/EventPage";
// import Calendar from "./pages/Calendar";

// // ProtectedRoute component
// const ProtectedRoute = ({ children }) => {
//   const { user, loading } = useAuth();
//   if (loading) return null; // or a loading spinner
//   return user ? children : <Navigate to="/login" replace />;
// };

const App = () => (
  <Box minH="100vh" bg="gray.50" w="100%">
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/:eventUid" element={<EventPage />} />
          {/* Add more protected routes as needed */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
  </Box>
);

export default App;
