import { Request, Response } from "express";
import {
  notifyBarberNewBooking,
  notifyClientConfirmed,
  notifyClientCancelled,
} from "../Utils/notifications";

// Tomamos el número y nombre del peluquero de la variable de entorno
const BARBER_PHONE = process.env.BARBER_PHONE!;

// Cliente reserva → notificación al peluquero
export const sendNewBooking = async (req: Request, res: Response) => {
  const { barberName, date, time } = req.body;

  try {
    await notifyBarberNewBooking(BARBER_PHONE, barberName, date);
    res.json({ success: true, message: "Notificación enviada al peluquero" });
  } catch (error) {
    res.status(500).json({ success: false, error: "Error enviando mensaje" });
  }
};

// Peluquero confirma → notificación al cliente
export const sendConfirmed = async (req: Request, res: Response) => {
  const { clientPhone, clientName, date, time } = req.body;

  try {
    await notifyClientConfirmed(clientPhone, clientName, date);
    res.json({ success: true, message: "Confirmación enviada al cliente" });
  } catch (error) {
    res.status(500).json({ success: false, error: "Error enviando mensaje" });
  }
};

// Peluquero cancela → notificación al cliente
export const sendCancelled = async (req: Request, res: Response) => {
  const { clientPhone, clientName, date, time } = req.body;

  try {
    await notifyClientCancelled(clientPhone, clientName, date);
    res.json({ success: true, message: "Cancelación enviada al cliente" });
  } catch (error) {
    res.status(500).json({ success: false, error: "Error enviando mensaje" });
  }
};
