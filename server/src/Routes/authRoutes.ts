import { Router } from 'express';
import { usuarioController } from '../Controllers/authController';

const router = Router();

// Rutas de autenticación
router.post('/register', async (req, res, next) => {
  await usuarioController.register(req, res, next);
});

router.post('/login', async (req, res, next) => {
  await usuarioController.login(req, res, next);
});

export default router;