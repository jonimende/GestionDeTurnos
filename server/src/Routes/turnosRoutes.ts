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

router.get("/pendientes", authenticateToken, async (req, res, next) => {
  await turnoController.listarTurnosPendientes(req, res, next);
});

// Confirmar turno → solo admin
router.put("/:id/confirmar", authenticateToken, isAdmin, async (req, res, next) => {
  await turnoController.confirmarTurno(req, res, next);
});

router.delete("/:id", authenticateToken, isAdmin, async (req, res, next) => {
  await turnoController.eliminarTurno(req, res, next);
});

export default router;
