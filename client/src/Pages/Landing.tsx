// client/src/Components/Landing.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

const Landing: React.FC = () => {
  const navigate = useNavigate();

  const handleRegisterClick = () => {
    navigate("/register");
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Bienvenido a Tende Corte</h1>
      <p>Tu peluquería de confianza. Reservá tu turno de manera rápida y sencilla.</p>
      <button onClick={handleRegisterClick}>Registrarse</button>
    </div>
  );
};

export default Landing;
