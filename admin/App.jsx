import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';


import "./App.css";

const App = () => {
  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <Router>
      {user && user.type === "admin" ? (
        <>
          <Navbar />
          <Routes>

          </Routes>
          <Footer />
        </>
      ) : (
        <Navigate to="/login"  />
      )}
    </Router>
  );
};

export default App;