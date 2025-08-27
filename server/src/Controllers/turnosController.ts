import { Request, Response, NextFunction } from "express";
import Turno from "../Models/Turnos";
import { Usuario } from "../Models/Usuario";
import { Op } from "sequelize";

// Extender Request para TypeScript si usamos JWT
interface AuthRequest extends Request {
  user?: any;
}

export const turnoController = {
  crearTurno: async (req: AuthRequest, res: Response, next: NextFunction) => {
    console.log("Body recibido en crearTurno:", req.body);
    const { fecha, usuarioId, deshabilitado } = req.body;

    if (!fecha || (usuarioId === undefined || usuarioId === null)) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    try {
      // Validamos usuario solo si no es turno admin/fantasma
      if (usuarioId !== 0) {
        const usuario = await Usuario.findByPk(usuarioId);
        if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
      }

      // Evitar choques de hora/minuto
      const fechaObj = new Date(fecha);
      fechaObj.setSeconds(0, 0);
      const fechaFin = new Date(fechaObj);
      fechaFin.setMinutes(fechaFin.getMinutes() + 1);

      const turnoExistente = await Turno.findOne({
        where: { fecha: { [Op.gte]: fechaObj, [Op.lt]: fechaFin } }
      });

      if (turnoExistente) {
        return res.status(400).json({ error: "El horario ya está reservado" });
      }

      // Creamos el turno sin generar error por include
      const nuevoTurno = await Turno.create({
        fecha: fechaObj,
        usuarioId: usuarioId === 0 ? null : usuarioId, // null para admin/fantasma
        confirmado: false,
        deshabilitado: !!deshabilitado,
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

  // Listar turnos pendientes
  listarTurnosPendientes: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const turnos = await Turno.findAll({
        where: { confirmado: false },
        include: [{ model: Usuario, as: "cliente", attributes: ["nombre", "apellido", "telefono"] }],
        order: [["fecha", "ASC"]],
      });
      return res.json(turnos);
    } catch (error) {
      console.error(error);
      next(error);
    }
  },

  // Historial de turnos (solo admin)
  historialTurnos: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const usuario = await Usuario.findByPk(req.user?.id);
      if (!usuario || usuario.admin !== true) {
        return res.status(403).json({ error: "Acceso denegado. Solo admin." });
      }

      const turnos = await Turno.findAll({
        include: [{ model: Usuario, as: "cliente", attributes: ["nombre", "apellido", "telefono"] }],
        order: [["fecha", "DESC"]],
      });

      return res.json(turnos);
    } catch (error) {
      console.error(error);
      next(error);
    }
  },

  // Confirmar turno (solo admin)
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

      await turno.update({ confirmado: true });
      return res.json({ message: `Turno confirmado para ${turno.cliente?.nombre} ${turno.cliente?.apellido}` });
    } catch (error) {
      console.error(error);
      next(error);
    }
  },

  // Eliminar turno
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

  // Deshabilitar turno
  deshabilitarTurno: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const turno = await Turno.findByPk(id);
      if (!turno) return res.status(404).json({ message: "Turno no encontrado" });

      // Marcamos el turno como deshabilitado
      turno.deshabilitado = true;
      await turno.save();

      return res.json({ message: "Turno deshabilitado correctamente", turno });
    } catch (error) {
      return res.status(500).json({ message: "Error al deshabilitar turno", error });
    }
  },
};
