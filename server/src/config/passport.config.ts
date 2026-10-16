import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "./prisma";
import { Role } from "@prisma/client";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const callbackUrl = process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/api/auth/google/callback";

export function configurePassport(): void {
  if (
    googleClientId &&
    googleClientSecret &&
    !googleClientId.includes("tu_google") &&
    googleClientId.trim().length > 0
  ) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: googleClientId,
          clientSecret: googleClientSecret,
          callbackURL: callbackUrl,
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) {
              return done(new Error("No se pudo obtener el correo de la cuenta de Google."), undefined);
            }

            // Buscar si ya existe por googleId o por email
            let user = await prisma.user.findFirst({
              where: {
                OR: [{ googleId: profile.id }, { email }],
                deletedAt: null,
              },
            });

            if (!user) {
              // Si no existe, crear usuario PARTICULAR automáticamente
              user = await prisma.user.create({
                data: {
                  email,
                  name: profile.displayName || "Usuario Google",
                  googleId: profile.id,
                  avatarUrl: profile.photos?.[0]?.value,
                  role: Role.PARTICULAR,
                  isEmailVerified: true,
                  province: "Buenos Aires", // Default inicial editable en su perfil
                  city: "CABA",
                },
              });
            } else if (!user.googleId) {
              // Si existía por email sin googleId, asociar googleId
              user = await prisma.user.update({
                where: { id: user.id },
                data: {
                  googleId: profile.id,
                  isEmailVerified: true,
                  avatarUrl: user.avatarUrl || profile.photos?.[0]?.value,
                },
              });
            }

            return done(null, user);
          } catch (error) {
            return done(error as Error, undefined);
          }
        }
      )
    );
  } else {
    console.warn("⚠️ [Passport] Google OAuth no configurado. Las rutas de Google OAuth responderán con aviso en desarrollo.");
  }
}

export default passport;
