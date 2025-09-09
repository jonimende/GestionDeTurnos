import { Router } from "express";
import { authenticateToken } from "../Middlewares/authenticateToken";
import * as notifyController from "../Controllers/notifyController";

const router = Router();

// Cliente reserva → notificación al peluquero
router.post("/reserved", authenticateToken, async (req, res) => {
  await notifyController.sendNewBooking(req, res);
});

// Peluquero confirma → notificación al cliente
router.post("/confirmed", authenticateToken, async (req, res) => {
  await notifyController.sendConfirmed(req, res);
});

// Peluquero cancela → notificación al cliente
router.post("/cancelled", authenticateToken, async (req, res) => {
  await notifyController.sendCancelled(req, res);
});

export default router;
