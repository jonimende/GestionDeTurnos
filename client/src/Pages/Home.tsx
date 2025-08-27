import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

interface Turno {
  id: number;
  fecha: string;
  usuarioId: number;
  confirmado: boolean;
  cliente?: {
    nombre: string;
    apellido: string;
  };
}

const Home: React.FC = () => {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>("");
  const [horaSeleccionada, setHoraSeleccionada] = useState<string>("");

  const horariosManana = ["09:00", "10:00", "11:00", "12:00"];
  const horariosTarde = ["16:00", "17:00", "18:00", "19:00", "20:00", "21:00"];

  const token = localStorage.getItem("token");
  const usuarioId = Number(localStorage.getItem("usuarioId"));
  const esAdmin = localStorage.getItem("rol") === "admin";

  const navigate = useNavigate();
  const location = useLocation();

  const fetchTurnos = () => {
    if (!token) return;

    axios
      .get<Turno[]>("http://localhost:5000/turnos", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => setTurnos(res.data))
      .catch(err => {
        console.error(err);
        setTurnos([]);
      });
  };

  // Refrescar turnos al montar y al volver de otra ruta
  useEffect(() => {
    fetchTurnos();
  }, [token, location]);

  const handleCrearTurno = () => {
    if (!fechaSeleccionada || !horaSeleccionada) {
      alert("Seleccioná fecha y hora");
      return;
    }
    if (!usuarioId) {
      alert("Usuario no identificado");
      return;
    }

    const fechaHora = new Date(`${fechaSeleccionada}T${horaSeleccionada}:00`).toISOString();

    axios
      .post(
        "http://localhost:5000/turnos",
        { fecha: fechaHora, usuarioId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        alert("Turno creado!");
        fetchTurnos(); // recarga todos los turnos
      })
      .catch(err => {
        console.error(err);
        alert(err.response?.data?.error || "Error al crear turno");
      });
  };

  const turnosConfirmados = turnos.filter(t => t.confirmado);

  return (
    <div>
      <h1>Reservá tu turno</h1>

      <div>
        <label>Fecha:</label>
        <input
          type="date"
          value={fechaSeleccionada}
          onChange={e => setFechaSeleccionada(e.target.value)}
        />
      </div>

      <div>
        <label>Hora:</label>
        <select value={horaSeleccionada} onChange={e => setHoraSeleccionada(e.target.value)}>
          <option value="">Seleccioná hora</option>
          {horariosManana.concat(horariosTarde).map(h => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
      </div>

      <button onClick={handleCrearTurno}>Reservar turno</button>

      <h2>Turnos confirmados</h2>
      <ul>
        {turnosConfirmados.length === 0 && <p>No hay turnos confirmados</p>}
        {turnosConfirmados.map(t => (
          <li key={t.id}>
            {new Date(t.fecha).toLocaleString()} -{" "}
            {t.cliente ? `${t.cliente.nombre} ${t.cliente.apellido}` : "Disponible"}
          </li>
        ))}
      </ul>

      {esAdmin && (
        <div style={{ marginTop: "20px" }}>
          <button onClick={() => navigate("/confirmar-turnos")}>
            Confirmar/Cancelar Turnos
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;
