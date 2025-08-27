import { Request, Response, NextFunction } from "express";
import Turno from "../Models/Turnos";
import { Usuario } from "../Models/Usuario";

// Extender Request para TypeScript si usamos JWT
interface AuthRequest extends Request {
  user?: any;
}

export const turnoController = {
  crearTurno: async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { fecha, usuarioId } = req.body;

    if (!fecha || !usuarioId) {
        return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    try {
        // Verificar que el usuario exista
        const usuario = await Usuario.findByPk(usuarioId);
        if (!usuario) {
        return res.status(404).json({ error: "Usuario no encontrado" });
        }

        // Verificar que el horario no esté ocupado
        const turnoExistente = await Turno.findOne({ where: { fecha } });
        if (turnoExistente) {
        return res.status(400).json({ error: "El horario ya está reservado" });
        }

        const nuevoTurno = await Turno.create({ fecha, usuarioId });
        return res.status(201).json({ message: "Turno creado", turno: nuevoTurno });
    } catch (error) {
        console.error(error);
        next(error);
    }
  },
  // Listar todos los turnos con datos del cliente
  listarTurnos: async ( req: Request, res: Response, next: NextFunction) => {
    try {
      const turnos = await Turno.findAll({
        include: [{ model: Usuario, as: "cliente", attributes: ["nombre", "apellido", "telefono"] }],
      });
      return res.json(turnos);
    } catch (error) {
      console.error(error);
      next(error);
    }
  },

    listarTurnosPendientes: async ( req: Request, res: Response, next: NextFunction) => {
    try {
        const turnos = await Turno.findAll({
        where: { confirmado: false }, // solo pendientes
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
        include: [
          { model: Usuario, as: "cliente", attributes: ["nombre", "apellido", "telefono"] }
        ],
        order: [["fecha", "DESC"]],
      });

      return res.json(turnos);
    } catch (error) {
      console.error(error);
      next(error);
    }
  },
  // Confirmar turno (podemos integrar WhatsApp luego)
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
};
