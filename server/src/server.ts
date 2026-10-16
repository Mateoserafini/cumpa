// Debe ser el primer import: carga .env antes de que los demás módulos lean process.env
import "dotenv/config";

import app from "./app";
import { initJobs } from "./jobs";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor de Cumpa ejecutándose en http://localhost:${PORT}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || "development"}`);
  initJobs();
});
