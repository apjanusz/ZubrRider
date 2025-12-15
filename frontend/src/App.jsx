import React from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Home from "./pages/Home"
import UserPage from "./pages/UserPage"
import DriverProfile from "./pages/DriverProfile"
import RideDetails from "./pages/RideDetails"
import PublishRide from "./pages/PublishRide" // NOWY
import MyRides from "./pages/MyRides"         // NOWY
import NotFound from "./pages/NotFound"
import ProtectedRoute from "./components/ProtectedRoute"
import Layout from "./components/Layout"

function Logout() {
  localStorage.clear()
  return <Navigate to="/login" />
}

function RegisterAndLogout() {
  localStorage.clear()
  return <Register />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>

          {/* TRASY WYMAGAJĄCE ZALOGOWANIA */}
          <Route path="/" element={
              <ProtectedRoute><Home /></ProtectedRoute>
          }/>
          <Route path="/profile" element={
              <ProtectedRoute><UserPage /></ProtectedRoute>
          }/>
          <Route path="/driver/:id" element={
              <ProtectedRoute><DriverProfile /></ProtectedRoute>
          }/>
          <Route path="/ride/:id" element={
              <ProtectedRoute><RideDetails /></ProtectedRoute>
          }/>
          
          {/* NOWE TRASY */}
          <Route path="/publish-ride" element={
              <ProtectedRoute><PublishRide /></ProtectedRoute>
          }/>
          <Route path="/my-rides" element={
              <ProtectedRoute><MyRides /></ProtectedRoute>
          }/>
          
          {/* TRASY PUBLICZNE */}
          <Route path="/login" element={<Login />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/register" element={<RegisterAndLogout />} />
          <Route path="*" element={<NotFound />} />

        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App