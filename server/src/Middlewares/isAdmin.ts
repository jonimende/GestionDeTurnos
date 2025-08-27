import { Request, Response, NextFunction } from "express";

interface AuthRequest extends Request {
  user?: any;
}

export const isAdmin = (req: any, res: Response, next: NextFunction) => {
  if (!req.user?.admin) return res.status(403).json({ error: "Acceso denegado" });
  next();
};