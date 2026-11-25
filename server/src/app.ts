import express from "express";
import cors from "cors";
import helmet from "helmet";
import passport from "passport";
import { configurePassport } from "./config/passport.config";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import { getAllowedOrigins } from "./utils/frontendUrl";

// Rutas de módulos
import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users/users.routes";
import animalsRoutes from "./modules/animals/animals.routes";
import contactsRoutes from "./modules/contacts/contacts.routes";
import followupsRoutes from "./modules/followups/followups.routes";
import adminRoutes from "./modules/admin/admin.routes";
import cronRoutes from "./modules/cron/cron.routes";

const app = express();

// Confiar en el proxy inverso (Render / Cloudflare) para headers X-Forwarded-Proto e IPs reales
app.set("trust proxy", 1);

// Middlewares globales de seguridad y parsing
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Permite requests sin encabezado Origin (como curl, healthchecks, mobile)
      if (!origin) return callback(null, true);
      const allowedOrigins = getAllowedOrigins();
      const cleanOrigin = origin.replace(/\/+$/, "");
      if (
        allowedOrigins.includes(cleanOrigin) ||
        allowedOrigins.includes("*") ||
        (process.env.NODE_ENV !== "production" &&
          (cleanOrigin.startsWith("http://localhost") ||
            cleanOrigin.startsWith("http://127.0.0.1")))
      ) {
        return callback(null, true);
      }
      return callback(new Error(`Origen ${origin} no permitido por política CORS.`));
    },
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

// Enrutadores de la API (con soporte tanto para /api/endpoint como /endpoint por resiliencia)
app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);

app.use("/api/users", usersRoutes);
app.use("/users", usersRoutes);

app.use("/api/animals", animalsRoutes);
app.use("/animals", animalsRoutes);

app.use("/api/contacts", contactsRoutes);
app.use("/contacts", contactsRoutes);

app.use("/api/followups", followupsRoutes);
app.use("/followups", followupsRoutes);

app.use("/api/admin", adminRoutes);
app.use("/admin", adminRoutes);

app.use("/api/cron", cronRoutes);
app.use("/cron", cronRoutes);

// Manejador de rutas no encontradas (404)
app.use((_req, res) => {
  res.status(404).json({ message: "Ruta no encontrada en la API." });
});

// Manejador global de excepciones y errores HTTP
app.use(errorHandler);

export default app;
