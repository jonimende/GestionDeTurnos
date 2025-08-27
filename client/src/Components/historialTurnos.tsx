import React, { useEffect, useState } from "react";
import axios from "axios";

interface Cliente {
  nombre: string;
  apellido: string;
  telefono: string;
}

interface Turno {
  id: number;
  fecha: string;
  confirmado: boolean;
  cliente: Cliente;
}

const HistorialTurnos: React.FC = () => {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        const token = localStorage.getItem("token"); // asumimos que guardaste el JWT en localStorage
        const res = await axios.get<Turno[]>("http://localhost:5000/turnos/historial", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTurnos(res.data);
      } catch (error) {
        console.error("Error al traer historial:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistorial();
  }, []);

  if (loading) return <p className="text-center mt-10">Cargando historial...</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-700">
        Historial de Clientes (Turnos)
      </h2>
      <div className="overflow-x-auto shadow-lg rounded-2xl">
        <table className="min-w-full bg-white border border-gray-200 rounded-xl">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-4 border-b">Cliente</th>
              <th className="py-2 px-4 border-b">Teléfono</th>
              <th className="py-2 px-4 border-b">Fecha</th>
              <th className="py-2 px-4 border-b">Estado</th>
            </tr>
          </thead>
          <tbody>
            {turnos.map((turno) => (
              <tr key={turno.id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b">
                  {turno.cliente?.nombre} {turno.cliente?.apellido}
                </td>
                <td className="py-2 px-4 border-b">{turno.cliente?.telefono}</td>
                <td className="py-2 px-4 border-b">
                  {new Date(turno.fecha).toLocaleString("es-AR")}
                </td>
                <td className="py-2 px-4 border-b">
                  {turno.confirmado ? (
                    <span className="text-green-600 font-semibold">Confirmado</span>
                  ) : (
                    <span className="text-red-600 font-semibold">Pendiente</span>
                  )}
                </td>
              </tr>
            ))}
            {turnos.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-4 text-gray-500">
                  No hay turnos en el historial.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistorialTurnos;
