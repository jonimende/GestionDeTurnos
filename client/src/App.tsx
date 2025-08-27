import React from "react";
import { Routes, Route } from "react-router-dom";
import Landing from "./Pages/Landing";
import Login from "./Components/Login";
import Register from "./Components/Register";
import Home from "./Pages/Home";
import PrivateRoute from "./Pages/PrivateRoute";
import ConfirmarTurnos from "./Components/confirmarTurnos";
import HistorialTurnos from "./Components/historialTurnos";

const App: React.FC = () => {
  const isAuthenticated = !!localStorage.getItem("token");

  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
       <Route element={<PrivateRoute isAuthenticated={isAuthenticated} />}>
            <Route path="/home" element={<Home />} />
            <Route path="/confirmar-turnos" element={<ConfirmarTurnos />} />
            <Route path="/historial" element={<HistorialTurnos />} />
       </Route>
    </Routes>
  );
};

export default App;
