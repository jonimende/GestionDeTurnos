import dotenv from "dotenv";
dotenv.config();
import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { sequelize } from "./db";
import authRoutes from "./Routes/authRoutes";
import turnoRoutes from "./Routes/turnosRoutes";
import notifyRoutes from "./Routes/notifyRoutes";

const app = express();

// Configura CORS
app.use(
  cors({
    origin: "https://gestion-de-turnos-beta.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(bodyParser.json());

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

const port = process.env.PORT || 5000;

sequelize
  .sync({ force: false })
  .then(() => {
    console.log("Base de datos sincronizada correctamente");
    app.listen(port, () => {
      console.log(`Servidor corriendo en http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Error al sincronizar la base de datos:", error);
  });
