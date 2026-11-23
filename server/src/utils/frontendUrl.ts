const DEFAULT_FRONTEND_URL = "http://localhost:5173";

/**
 * Devuelve la lista de orígenes permitidos a partir de FRONTEND_URL
 * (soporta múltiples URLs separadas por coma), normalizados sin barras finales.
 */
export function getAllowedOrigins(rawEnv: string | undefined = process.env.FRONTEND_URL): string[] {
  const source = rawEnv && rawEnv.trim().length > 0 ? rawEnv : DEFAULT_FRONTEND_URL;

  const origins = source
    .split(",")
    .map((url) => url.trim().replace(/\/+$/, ""))
    .filter((url) => url.length > 0);

  return origins.length > 0 ? origins : [DEFAULT_FRONTEND_URL];
}

/**
 * Devuelve la URL principal del frontend (el primer origen válido distinto de "*"),
 * segura para construir enlaces en correos electrónicos y redirecciones OAuth.
 */
export function getPrimaryFrontendUrl(rawEnv: string | undefined = process.env.FRONTEND_URL): string {
  const origins = getAllowedOrigins(rawEnv);
  const primary = origins.find((origin) => origin !== "*");
  return primary || DEFAULT_FRONTEND_URL;
}
