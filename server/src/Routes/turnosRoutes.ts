import { Router } from "express";
import { turnoController } from "../Controllers/turnosController";
import { authenticateToken } from "../Middlewares/authenticateToken";
import { isAdmin } from "../Middlewares/isAdmin";

const router = Router();

// Crear turno → solo usuarios autenticados
router.post("/", authenticateToken, async (req, res, next) => {
  await turnoController.crearTurno(req, res, next);
});

// Listar turnos → solo usuarios autenticados
router.get("/", authenticateToken, async (req, res, next) => {
  await turnoController.listarTurnos(req, res, next);
});

router.get("/historial", authenticateToken, isAdmin, async (req, res, next) => {
  await turnoController.historialTurnos(req, res, next);
});

router.get("/pendientes", authenticateToken, async (req, res, next) => {
  await turnoController.listarTurnosPendientes(req, res, next);
});

router.put("/:id/confirmar", authenticateToken, isAdmin, async (req, res, next) => {
  await turnoController.confirmarTurno(req, res, next);
});

router.put("/:id/deshabilitar", authenticateToken, isAdmin, async (req, res) => {
  await turnoController.deshabilitarTurno(req, res);
});

router.put("/:id/cancelar", authenticateToken, isAdmin, async (req, res) => {
  await turnoController.cancelarTurno(req, res);
});

router.put("/:id/habilitar", authenticateToken, isAdmin, async (req, res) => {
  await turnoController.habilitarTurno(req, res);
});

router.delete("/:id", authenticateToken, isAdmin, async (req, res, next) => {
  await turnoController.eliminarTurno(req, res, next);
});

export default router;
