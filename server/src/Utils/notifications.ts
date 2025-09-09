// src/services/notifications.ts
import { sendTemplateMessage } from "./whatsappService";

// 🔹 Helper para formatear fecha y hora en Buenos Aires
const formatFechaHora = (fecha: Date) => {
  const date = fecha.toLocaleDateString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
  });

  const time = fecha.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  });

  return { date, time };
};

export const notifyBarberNewBooking = async (
  barberPhone: string,
  barberName: string,
  fecha: Date
) => {
  const { date, time } = formatFechaHora(fecha);

  return sendTemplateMessage(barberPhone, "aviso_de_turno_reservado", "es_AR", [
    {
      type: "body",
      parameters: [
        { type: "text", text: barberName },
        { type: "text", text: date },
        { type: "text", text: time },
      ],
    },
  ]);
};

export const notifyClientConfirmed = async (
  clientPhone: string,
  clientName: string,
  turnoFecha: Date
) => {
  const { date, time } = formatFechaHora(turnoFecha);

  return sendTemplateMessage(clientPhone, "confirmacion_turno", "es_AR", [
    {
      type: "body",
      parameters: [
        { type: "text", text: clientName },
        { type: "text", text: date },
        { type: "text", text: time },
      ],
    },
  ]);
};

export const notifyClientCancelled = async (
  clientPhone: string,
  clientName: string,
  turnoFecha: Date
) => {
  const { date, time } = formatFechaHora(turnoFecha);

  return sendTemplateMessage(clientPhone, "cancelacion_turno", "es_AR", [
    {
      type: "body",
      parameters: [
        { type: "text", text: clientName },
        { type: "text", text: date },
        { type: "text", text: time },
      ],
    },
  ]);
};
