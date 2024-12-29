import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './src/components/Auth/Login';
import Dashboard from './src/components/Admin/Dashboard';
import "./App.css";

const App = () => {
  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/Dashboard"element={<Dashboard/>}/> 
      </Routes>
    </Router>
  );
};

export default App;