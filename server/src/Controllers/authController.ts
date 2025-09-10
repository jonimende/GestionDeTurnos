import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Usuario } from "../Models/Usuario";

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

export const usuarioController = {
  // Registro de usuario
  register: async (req: Request, res: Response, next: NextFunction) => {
    const { nombre, apellido, telefono, password } = req.body;
    if (!nombre || !apellido || !telefono || !password) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    try {
      const existingUser = await Usuario.findOne({ where: { telefono } });
      if (existingUser) {
        return res.status(409).json({ error: "El teléfono ya está registrado" });
      }

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      const newUser = await Usuario.create({
        nombre,
        apellido,
        telefono,
        password: hashedPassword,
      });

      const token = jwt.sign({ id: newUser.id }, JWT_SECRET, { expiresIn: "3h" });

      return res.status(201).json({ message: "Usuario creado correctamente", usuario: newUser, token });
    } catch (error) {
      console.error(error);
      next(error);
    }
  },

  login: async (req: Request, res: Response, next: NextFunction) => {
    const { telefono, password } = req.body;

    if (!telefono || !password) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    try {
      const user = await Usuario.findOne({ where: { telefono } });
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: "Contraseña incorrecta" });
      }

      const token = jwt.sign(
        { id: user.id, admin: user.admin },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      return res.json({
        token,
        usuario: {
          id: user.id,
          telefono: user.telefono, // ahora devuelve el teléfono en lugar del nombre
          admin: user.admin
        }
      });
    } catch (error) {
      console.error(error);
      next(error);
    }
  },
};
