import express from "express";
import cors from "cors";
import helmet from "helmet";
import passport from "passport";
import { configurePassport } from "./config/passport.config";
import { errorHandler } from "./middlewares/errorHandler.middleware";

// Rutas de módulos
import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users/users.routes";
import animalsRoutes from "./modules/animals/animals.routes";
import contactsRoutes from "./modules/contacts/contacts.routes";
import followupsRoutes from "./modules/followups/followups.routes";
import adminRoutes from "./modules/admin/admin.routes";

const app = express();

// Middlewares globales de seguridad y parsing
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inicialización de Passport para OAuth
configurePassport();
app.use(passport.initialize());

// Endpoint de salud del servidor (usado por Render / UptimeRobot)
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Cumpa API",
  });
});

// Enrutadores de la API
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/animals", animalsRoutes);
app.use("/api/contacts", contactsRoutes);
app.use("/api/followups", followupsRoutes);
app.use("/api/admin", adminRoutes);

// Manejador de rutas no encontradas (404)
app.use((_req, res) => {
  res.status(404).json({ message: "Ruta no encontrada en la API." });
});

// Manejador global de excepciones y errores HTTP
app.use(errorHandler);

export default app;
