import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import type { Request } from "express";
import prisma from "./prisma";
import { Role, User } from "@prisma/client";

const ALLOWED_OAUTH_ROLES: ReadonlySet<Role> = new Set<Role>([
  Role.PARTICULAR,
  Role.INSTITUCION,
  Role.VETERINARIA,
]);

/**
 * Valida y normaliza el rol recibido por query/state en el flujo de Google OAuth.
 * Nunca permite escalar a ADMIN; ante cualquier valor inválido retorna PARTICULAR.
 */
export function parseOAuthRole(rawRole: unknown): Role {
  if (typeof rawRole !== "string") return Role.PARTICULAR;
  const normalized = rawRole.trim().toUpperCase() as Role;
  return ALLOWED_OAUTH_ROLES.has(normalized) ? normalized : Role.PARTICULAR;
}

/**
 * Resuelve o crea el usuario a partir de un perfil de Google OAuth y el parámetro `state`.
 * - Normaliza el correo electrónico.
 * - Rechaza cuentas dadas de baja lógicamente (`deletedAt !== null`) devolviendo `null`.
 * - Nunca sobrescribe el rol de una cuenta existente ni permite escalar a ADMIN.
 */
export async function resolveGoogleOAuthUser(
  profile: Pick<Profile, "id" | "displayName" | "emails" | "photos">,
  rawState: unknown
): Promise<User | null> {
  const rawEmail = profile.emails?.[0]?.value;
  if (!rawEmail || rawEmail.trim().length === 0) {
    throw new Error("No se pudo obtener el correo de la cuenta de Google.");
  }

  const email = rawEmail.trim().toLowerCase();
  const [localPart, domain] = email.split("@");
  const gmailCanonicalEmail =
    localPart && (domain === "gmail.com" || domain === "googlemail.com")
      ? `${localPart.split("+")[0].replace(/\./g, "")}@gmail.com`
      : null;

  const lookupConditions: Array<{ googleId?: string; email?: string }> = [
    { googleId: profile.id },
    { email },
  ];
  if (gmailCanonicalEmail && gmailCanonicalEmail !== email) {
    lookupConditions.push({ email: gmailCanonicalEmail });
  }

  // Buscar por googleId o email (incluyendo variante canónica de Gmail y registros dados de baja)
  let user = await prisma.user.findFirst({
    where: {
      OR: lookupConditions,
    },
  });

  if (user && user.deletedAt !== null) {
    // Cuenta dada de baja / suspendida: denegar acceso OAuth limpiamente
    return null;
  }

  if (!user) {
    // Crear usuario con el rol validado proveniente del parámetro state (o PARTICULAR por defecto)
    const assignedRole = parseOAuthRole(rawState);

    user = await prisma.user.create({
      data: {
        email,
        name: profile.displayName || "Usuario Google",
        googleId: profile.id,
        avatarUrl: profile.photos?.[0]?.value,
        role: assignedRole,
        isEmailVerified: true,
        province: "Buenos Aires", // Default inicial editable en su perfil
        city: "CABA",
      },
    });
  } else if (!user.googleId) {
    // Si existía por email sin googleId, asociar googleId sin alterar su rol actual
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: profile.id,
        isEmailVerified: true,
        avatarUrl: user.avatarUrl || profile.photos?.[0]?.value,
      },
    });
  }

  return user;
}

export function configurePassport(): void {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackUrl =
    process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/api/auth/google/callback";

  if (
    googleClientId &&
    googleClientSecret &&
    !googleClientId.includes("tu_google") &&
    googleClientId.trim().length > 0
  ) {
    console.log(`🔑 [Passport] Google OAuth activo. Callback URL registrado: ${callbackUrl}`);

    passport.use(
      new GoogleStrategy(
        {
          clientID: googleClientId,
          clientSecret: googleClientSecret,
          callbackURL: callbackUrl,
          proxy: true, // Respeta encabezados X-Forwarded-Proto en Render/Cloudflare para https
          passReqToCallback: true,
        },
        async (req: Request, _accessToken, _refreshToken, profile, done) => {
          try {
            const user = await resolveGoogleOAuthUser(profile, req.query?.state);
            if (!user) {
              return done(null, false);
            }
            return done(null, user);
          } catch (error) {
            return done(error as Error, undefined);
          }
        }
      )
    );
  } else {
    console.warn(
      "⚠️ [Passport] Google OAuth no configurado. Las rutas de Google OAuth responderán con aviso en desarrollo."
    );
  }
}

export default passport;
