import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
// import { useAuth } from "./context/AuthContext";
// import Layout from "./layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
// import Events from "./pages/Events";
// import Calendar from "./pages/Calendar";

// // ProtectedRoute component
// const ProtectedRoute = ({ children }) => {
//   const { user, loading } = useAuth();
//   if (loading) return null; // or a loading spinner
//   return user ? children : <Navigate to="/login" replace />;
// };

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/login" element={<Login />} />
      {/* <Route
        path="/events"
        element={
          <ProtectedRoute>
            <Events />
          </ProtectedRoute>
        } */}
      {/* /> */}
      {/* <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <Calendar />
          </ProtectedRoute>
        }
      /> */}
      {/* Add more protected routes as needed */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Router>
);

export default App;
