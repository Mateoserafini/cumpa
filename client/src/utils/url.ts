/**
 * Utilidades de sanitización de URLs externas para prevenir inyección `javascript:` / XSS
 * y normalizar identificadores de redes sociales (ej. `@refugio_oficial`).
 */

export function toSafeExternalUrl(raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}

export function toSafeInstagramUrl(raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Rechazar esquemas peligrosos explícitamente antes de normalizar
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) && !/^https?:\/\//i.test(trimmed)) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return toSafeExternalUrl(trimmed);
  }

  // Handle estilo "@refugio_oficial" o "refugio_oficial"
  const handle = trimmed.replace(/^@+/, '').replace(/\/+$/, '');
  if (!/^[a-zA-Z0-9._]+$/.test(handle)) {
    return null;
  }
  return `https://instagram.com/${encodeURIComponent(handle)}`;
}
