import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './src/components/Auth/Login';
import Dashboard from './src/components/Admin/dashboard';      
import "./App.css";

const App = () => {
  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            user && user.type === "admin" ? (
              <>
                <Routes>
                  <Route path="/Dashboard" element={<Dashboard />} />
                </Routes>
              </>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
};

export default App;