import React, { useEffect, useState } from "react";
import axios from "axios";

interface Turno {
  id: number;
  fecha: string;
  usuarioId: number;
  confirmado: boolean;
  cliente?: {
    nombre: string;
    apellido: string;
    telefono: string;
  };
}

const ConfirmarTurnos: React.FC = () => {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const token = localStorage.getItem("token");
  const esAdmin = localStorage.getItem("rol") === "admin";

  const fetchTurnosPendientes = () => {
    if (!token || !esAdmin) return;

    axios
      .get<Turno[]>("http://localhost:5000/turnos/pendientes", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => setTurnos(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchTurnosPendientes();
  }, [token, esAdmin]);

  if (!esAdmin) return <p>No tenés permisos para acceder a esta sección</p>;

  const handleConfirmar = (id: number) => {
    if (!token) return;

    axios
      .put(
        `http://localhost:5000/turnos/${id}/confirmar`,
        {}, // body vacío
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => fetchTurnosPendientes()) // refresca la lista de pendientes
      .catch(err => console.error(err));
  };

  const handleCancelar = (id: number) => {
    if (!token) return;

    axios
      .delete(`http://localhost:5000/turnos/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => fetchTurnosPendientes())
      .catch(err => console.error(err));
  };

  return (
    <div>
      <h1>Confirmar / Cancelar Turnos</h1>
      {turnos.length === 0 && <p>No hay turnos pendientes</p>}
      <ul>
        {turnos.map(t => (
          <li key={t.id}>
            {new Date(t.fecha).toLocaleString()} -{" "}
            {t.cliente ? `${t.cliente.nombre} ${t.cliente.apellido}` : "Disponible"}{" "}
            <button onClick={() => handleConfirmar(t.id)}>Confirmar</button>
            <button onClick={() => handleCancelar(t.id)}>Cancelar</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ConfirmarTurnos;
