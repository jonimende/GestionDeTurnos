import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;

// Extender Request para que TypeScript reconozca `user`
interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded; // aquí ya viene { id, admin }
    next();
  } catch {
    return res.sendStatus(403);
  }
};

