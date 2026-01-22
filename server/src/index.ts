import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { sequelize } from "./db";
import authRoutes from "./Routes/authRoutes";
import turnoRoutes from "./Routes/turnosRoutes";
import notifyRoutes from "./Routes/notifyRoutes";

const app = express();

// Configura CORS
app.use(
  cors({
    origin: ["http://localhost:4200","https://tende-corte.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Parse JSON
app.use(express.json());

// Rutas
app.use("/auth", authRoutes);
app.use("/turnos", turnoRoutes);
app.use("/notify", notifyRoutes);

// Manejo de errores
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({
    message: "Ha ocurrido un error en el servidor",
    error: err.message,
  });
});

// Puerto dinámico asignado por Railway
const port = process.env.PORT || 5000;

// Arrancar servidor inmediatamente
app.listen(port, () => {
  console.log(`Servidor corriendo en puerto ${port}`);
});

// Conectar y sincronizar la base de datos de forma asíncrona
(async () => {
  try {
    await sequelize.authenticate();
    console.log("Conexión a la base de datos exitosa");
    await sequelize.sync({ force: false });
    console.log("Base de datos sincronizada correctamente");
  } catch (error: any) {
    console.error("Error al conectar o sincronizar la DB:", error.message);
  }
})();
