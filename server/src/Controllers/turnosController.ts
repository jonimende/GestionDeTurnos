// src/controllers/turnoController.ts
import { Request, Response, NextFunction } from "express";
import Turno from "../Models/Turnos";
import { Usuario } from "../Models/Usuario";
import { Op } from "sequelize";
import {
  notifyBarberNewBooking,
  notifyClientConfirmed,
  notifyClientCancelled,
} from "../Utils/notifications";

interface AuthRequest extends Request {
  user?: any;
}

const BARBER_PHONE = process.env.BARBER_PHONE!;

// 🔹 Convierte string de frontend a Date local exacta
const parseLocalDate = (fechaStr: string) => {
  const [datePart, timePart] = fechaStr.includes("T") ? fechaStr.split("T") : fechaStr.split(" ");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
};

// 🔹 Convierte fecha UTC guardada en DB a hora local Argentina
const toLocalTime = (fecha: Date) => {
  return new Date(
    fecha.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" })
  );
};

export const turnoController = {
  crearTurno: async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { fecha, usuarioId, deshabilitado } = req.body;

    if (!fecha || usuarioId === undefined || usuarioId === null) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    try {
      let cliente;
      if (usuarioId !== 0) {
        cliente = await Usuario.findByPk(usuarioId);
        if (!cliente) return res.status(404).json({ error: "Usuario no encontrado" });
      }

      // Interpretar la fecha como local exacta
      const fechaObj = parseLocalDate(fecha);
      const fechaFin = new Date(fechaObj);
      fechaFin.setMinutes(fechaFin.getMinutes() + 1);

      // Verificar turno existente
      const turnoExistente = await Turno.findOne({
        where: {
          fecha: { [Op.gte]: fechaObj, [Op.lt]: fechaFin },
          estado: { [Op.in]: ["reservado", "confirmado"] },
        },
      });

      if (turnoExistente) {
        return res.status(400).json({ error: "El horario ya está reservado" });
      }

      // Determinar estado
      let estado: Turno["estado"] = "disponible";
      if (deshabilitado) estado = "deshabilitado";
      else if (usuarioId && usuarioId !== 0) estado = "reservado";

      // Crear turno
      const nuevoTurno = await Turno.create({
        fecha: fechaObj,
        usuarioId: usuarioId === 0 ? null : usuarioId,
        estado,
      });

      // Notificación al peluquero
      if (estado === "reservado" && cliente) {
        const nombreCliente = `${cliente.nombre} ${cliente.apellido}`;
        await notifyBarberNewBooking(BARBER_PHONE, nombreCliente, fechaObj);
      }

      return res.status(201).json({
        message: "Turno creado",
        turno: { ...nuevoTurno.toJSON(), fecha: toLocalTime(nuevoTurno.fecha) },
      });
    } catch (error) {
      console.error("Error crearTurno:", error);
      return res.status(500).json({ error: "Error interno al crear el turno" });
    }
  },

  listarTurnos: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const turnos = await Turno.findAll({
        include: [{ model: Usuario, as: "cliente", attributes: ["nombre", "apellido", "telefono"] }],
        order: [["fecha", "ASC"]],
      });

      const turnosLocales = turnos.map(t => ({
        ...t.toJSON(),
        fecha: toLocalTime(t.fecha),
      }));

      return res.json(turnosLocales);
    } catch (error) {
      console.error(error);
      next(error);
    }
  },

  listarTurnosPendientes: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const turnos = await Turno.findAll({
        where: { estado: "reservado" },
        include: [{ model: Usuario, as: "cliente", attributes: ["nombre", "apellido", "telefono"] }],
        order: [["fecha", "ASC"]],
      });

      const turnosLocales = turnos.map(t => ({
        ...t.toJSON(),
        fecha: toLocalTime(t.fecha),
      }));

      return res.json(turnosLocales);
    } catch (error) {
      console.error(error);
      next(error);
    }
  },

  historialTurnos: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const usuario = await Usuario.findByPk(req.user?.id);
      if (!usuario || usuario.admin !== true) {
        return res.status(403).json({ error: "Acceso denegado. Solo admin." });
      }

      const turnos = await Turno.findAll({
        where: { estado: { [Op.in]: ["confirmado", "reservado"] } },
        include: [
          { model: Usuario, as: "cliente", attributes: ["nombre", "apellido", "telefono"] }
        ],
        order: [["fecha", "DESC"]],
      });

      const turnosFormateados = turnos.map(t => ({
        id: t.id,
        fecha: toLocalTime(t.fecha),
        confirmado: t.estado === "confirmado",
        cliente: t.cliente,
      }));

      return res.json(turnosFormateados);
    } catch (error) {
      console.error(error);
      next(error);
    }
  },

  confirmarTurno: async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    try {
      const usuario = await Usuario.findByPk(req.user?.id);
      if (!usuario || usuario.admin !== true) {
        return res.status(403).json({ error: "Acceso denegado. Solo admin." });
      }

      const turno = await Turno.findByPk(id, {
        include: [{ model: Usuario, as: "cliente" }],
      });

      if (!turno) return res.status(404).json({ error: "Turno no encontrado" });

      await turno.update({ estado: "confirmado" });

      if (turno.cliente) {
        const nombreCliente = `${turno.cliente.nombre} ${turno.cliente.apellido}`;
        await notifyClientConfirmed(turno.cliente.telefono, nombreCliente, turno.fecha);
      }

      return res.json({
        message: `Turno confirmado para ${turno.cliente?.nombre} ${turno.cliente?.apellido}`,
        turno: { ...turno.toJSON(), fecha: toLocalTime(turno.fecha) },
      });
    } catch (error) {
      console.error(error);
      next(error);
    }
  },

  eliminarTurno: async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    try {
      const turno = await Turno.findByPk(id, {
        include: [{ model: Usuario, as: "cliente", attributes: ["nombre", "apellido", "telefono"] }],
      });

      if (!turno) return res.status(404).json({ error: "Turno no encontrado" });

      if (turno.cliente) {
        const nombreCliente = `${turno.cliente.nombre} ${turno.cliente.apellido}`;
        await notifyClientCancelled(turno.cliente.telefono, nombreCliente, turno.fecha);
      }

      await turno.destroy();
      return res.json({ message: "Turno eliminado" });
    } catch (error) {
      console.error(error);
      next(error);
    }
  },

  deshabilitarTurno: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const turno = await Turno.findByPk(id);
      if (!turno) return res.status(404).json({ message: "Turno no encontrado" });

      turno.estado = "deshabilitado";
      await turno.save();

      return res.json({
        message: "Turno deshabilitado correctamente",
        turno: { ...turno.toJSON(), fecha: toLocalTime(turno.fecha) },
      });
    } catch (error) {
      return res.status(500).json({ message: "Error al deshabilitar turno", error });
    }
  },

  habilitarTurno: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const turno = await Turno.findByPk(id);
      if (!turno) return res.status(404).json({ message: "Turno no encontrado" });

      turno.estado = "disponible";
      await turno.save();

      return res.json({
        message: "Turno habilitado correctamente",
        turno: { ...turno.toJSON(), fecha: toLocalTime(turno.fecha) },
      });
    } catch (error) {
      return res.status(500).json({ message: "Error al habilitar turno", error });
    }
  },

  cancelarTurno: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const turno = await Turno.findByPk(id, {
        include: [{ model: Usuario, as: "cliente", attributes: ["nombre", "apellido", "telefono"] }],
      });

      if (!turno) return res.status(404).json({ message: "Turno no encontrado" });

      if (turno.cliente) {
        const nombreCliente = `${turno.cliente.nombre} ${turno.cliente.apellido}`;
        await notifyClientCancelled(turno.cliente.telefono, nombreCliente, turno.fecha);
      }

      turno.estado = "cancelado";
      turno.usuarioId = null;
      await turno.save();

      return res.json({
        message: "Turno cancelado correctamente",
        turno: { ...turno.toJSON(), fecha: toLocalTime(turno.fecha) },
      });
    } catch (error) {
      console.error("Error cancelarTurno:", error);
      return res.status(500).json({ message: "Error al cancelar turno", error });
    }
  },
};
