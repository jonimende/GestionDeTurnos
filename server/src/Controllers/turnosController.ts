import { Request, Response, NextFunction } from "express";
import Turno from "../Models/Turnos";
import { Usuario } from "../Models/Usuario";
import { Op } from "sequelize";

interface AuthRequest extends Request {
  user?: any;
}

export const turnoController = {
  crearTurno: async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { fecha, usuarioId, deshabilitado } = req.body;

    if (!fecha || usuarioId === undefined || usuarioId === null) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    try {
      // Solo buscamos usuario si no es 0
      if (usuarioId !== 0) {
        const usuario = await Usuario.findByPk(usuarioId);
        if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
      }

      const fechaObj = new Date(fecha);
      fechaObj.setSeconds(0, 0); // fijamos segundos y milisegundos
      const fechaFin = new Date(fechaObj);
      fechaFin.setMinutes(fechaFin.getMinutes() + 1);

      // 🔹 Solo chequeamos turnos activos (reservado o confirmado)
      const turnoExistente = await Turno.findOne({
        where: {
          fecha: { [Op.gte]: fechaObj, [Op.lt]: fechaFin },
          estado: { [Op.in]: ["reservado", "confirmado"] }
        },
      });

      if (turnoExistente) {
        return res.status(400).json({ error: "El horario ya está reservado" });
      }

      // Lógica de estado
      let estado: Turno["estado"] = "disponible";
      if (deshabilitado) {
        estado = "deshabilitado";
      } else if (usuarioId && usuarioId !== 0) {
        estado = "reservado";
      }

      const nuevoTurno = await Turno.create({
        fecha: fechaObj,
        usuarioId: usuarioId === 0 ? null : usuarioId,
        estado,
      });

      return res.status(201).json({ message: "Turno creado", turno: nuevoTurno });
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
      return res.json(turnos);
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
      return res.json(turnos);
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

      // Mapear los turnos para que el frontend tenga `confirmado` como boolean
      const turnosFormateados = turnos.map(t => ({
        id: t.id,
        fecha: t.fecha,
        confirmado: t.estado === "confirmado", 
        cliente: t.cliente
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
      return res.json({
        message: `Turno confirmado para ${turno.cliente?.nombre} ${turno.cliente?.apellido}`,
      });
    } catch (error) {
      console.error(error);
      next(error);
    }
  },

  eliminarTurno: async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    try {
      const turno = await Turno.findByPk(id);
      if (!turno) return res.status(404).json({ error: "Turno no encontrado" });

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

      return res.json({ message: "Turno deshabilitado correctamente", turno });
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

      return res.json({ message: "Turno habilitado correctamente", turno });
    } catch (error) {
      return res.status(500).json({ message: "Error al habilitar turno", error });
    }
  },

  cancelarTurno: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const turno = await Turno.findByPk(id);
      if (!turno) return res.status(404).json({ message: "Turno no encontrado" });

      turno.estado = "cancelado";
      turno.usuarioId = null;
      await turno.save();

      return res.json({ message: "Turno cancelado correctamente", turno });
    } catch (error) {
      return res.status(500).json({ message: "Error al cancelar turno", error });
    }
  },
};
