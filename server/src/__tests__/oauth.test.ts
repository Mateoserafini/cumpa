import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import passport from "passport";
import { Role } from "@prisma/client";
import app from "../app";
import { parseOAuthRole, resolveGoogleOAuthUser } from "../config/passport.config";
import authController from "../modules/auth/auth.controller";
import { db } from "./mockDb";
import { seedUser, TEST_JWT_SECRET } from "./helpers";

describe("Google OAuth — Unit & Integration Tests (state/roles & security)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.JWT_SECRET = TEST_JWT_SECRET;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  describe("resolveGoogleOAuthUser (Unit)", () => {
    it("[Happy] crea nuevo usuario con rol INSTITUCION o VETERINARIA según el parámetro state", async () => {
      const instUser = await resolveGoogleOAuthUser(
        {
          id: "google-inst-1",
          displayName: "Refugio Esperanza",
          emails: [{ value: "  Refugio@Gmail.COM ", verified: true }],
          photos: [{ value: "https://lh3.googleusercontent.com/avatar1.jpg" }],
        },
        "INSTITUCION"
      );

      expect(instUser).not.toBeNull();
      expect(instUser?.email).toBe("refugio@gmail.com");
      expect(instUser?.role).toBe(Role.INSTITUCION);
      expect(instUser?.isEmailVerified).toBe(true);
      expect(instUser?.googleId).toBe("google-inst-1");

      const vetUser = await resolveGoogleOAuthUser(
        {
          id: "google-vet-1",
          displayName: "Veterinaria Sur",
          emails: [{ value: "vet@gmail.com", verified: true }],
          photos: [],
        },
        " veterinaria "
      );

      expect(vetUser?.role).toBe(Role.VETERINARIA);
    });

    it("[Wrong/Security] impide escalación a ADMIN via state manipulado y asigna PARTICULAR", async () => {
      const user = await resolveGoogleOAuthUser(
        {
          id: "google-attacker-1",
          displayName: "Atacante",
          emails: [{ value: "attacker@example.com", verified: true }],
          photos: [],
        },
        "ADMIN"
      );

      expect(user).not.toBeNull();
      expect(user?.role).toBe(Role.PARTICULAR);
      expect(parseOAuthRole("ADMIN")).toBe(Role.PARTICULAR);
    });

    it("[Edge] asocia googleId a una cuenta existente por email SIN sobrescribir su rol", async () => {
      const existing = await seedUser({
        email: "existente@cumpa.org",
        role: Role.PARTICULAR,
        googleId: null,
        isEmailVerified: false,
      });

      const resolved = await resolveGoogleOAuthUser(
        {
          id: "google-link-99",
          displayName: "Nombre Nuevo",
          emails: [{ value: "EXISTENTE@CUMPA.ORG", verified: true }],
          photos: [{ value: "https://example.com/photo.png" }],
        },
        "INSTITUCION"
      );

      expect(resolved?.id).toBe(existing.id);
      expect(resolved?.googleId).toBe("google-link-99");
      expect(resolved?.role).toBe(Role.PARTICULAR); // Nunca altera el rol actual
      expect(resolved?.isEmailVerified).toBe(true);
    });

    it("[Edge] vincula cuenta Gmail registrada tradicionalmente con normalizeEmail (sin puntos) sin crear duplicado", async () => {
      const existing = await seedUser({
        email: "mariaperez@gmail.com", // como lo normaliza express-validator normalizeEmail()
        role: Role.PARTICULAR,
        googleId: null,
      });

      const resolved = await resolveGoogleOAuthUser(
        {
          id: "google-gmail-dots",
          displayName: "Maria Perez",
          emails: [{ value: "maria.perez@gmail.com", verified: true }],
          photos: [],
        },
        "PARTICULAR"
      );

      expect(resolved?.id).toBe(existing.id);
      expect(resolved?.googleId).toBe("google-gmail-dots");
      expect(db.users).toHaveLength(1);
    });

    it("[Edge] nunca altera el rol de un ADMIN existente que inicia sesión por Google", async () => {
      const admin = await seedUser({
        email: "admin@cumpa.org",
        role: Role.ADMIN,
        googleId: "google-admin-1",
      });

      const resolved = await resolveGoogleOAuthUser(
        {
          id: "google-admin-1",
          displayName: "Admin",
          emails: [{ value: "admin@cumpa.org", verified: true }],
          photos: [],
        },
        "PARTICULAR"
      );

      expect(resolved?.id).toBe(admin.id);
      expect(resolved?.role).toBe(Role.ADMIN);
    });

    it("[Security/Edge] rechaza con null el acceso OAuth a una cuenta dada de baja (soft-deleted / baneada)", async () => {
      const banned = await seedUser({
        email: "baneado@cumpa.org",
        googleId: "google-banned-1",
      });
      const inDb = db.users.find((u) => u.id === banned.id);
      if (inDb) inDb.deletedAt = new Date();

      const resolved = await resolveGoogleOAuthUser(
        {
          id: "google-banned-1",
          displayName: "Usuario Baneado",
          emails: [{ value: "baneado@cumpa.org", verified: true }],
          photos: [],
        },
        "PARTICULAR"
      );

      expect(resolved).toBeNull();
      // No debe crear un duplicado
      expect(db.users.filter((u) => u.email === "baneado@cumpa.org")).toHaveLength(1);
    });

    it("[Wrong] lanza error si Google no provee dirección de correo", async () => {
      await expect(
        resolveGoogleOAuthUser(
          {
            id: "google-no-email",
            displayName: "Sin Correo",
            emails: [],
            photos: [],
          },
          "PARTICULAR"
        )
      ).rejects.toThrow(/correo/i);
    });
  });

  describe("Rutas GET /api/auth/google y googleCallback (Integration)", () => {
    it("[Happy/Security] GET /api/auth/google propaga role válido en state y degrada ADMIN a PARTICULAR", async () => {
      process.env.GOOGLE_CLIENT_ID = "real-client-id.apps.googleusercontent.com";
      process.env.GOOGLE_CLIENT_SECRET = "real-client-secret";

      const capturedStates: string[] = [];
      vi.spyOn(passport, "authenticate").mockImplementation(((_strategy: any, options: any) => {
        capturedStates.push(options?.state);
        return (_req: any, res: any) => {
          res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?state=${options?.state}`);
        };
      }) as any);

      const resInst = await request(app).get("/api/auth/google?role=INSTITUCION");
      expect(resInst.status).toBe(302);
      expect(resInst.headers.location).toContain("state=INSTITUCION");

      const resAdmin = await request(app).get("/api/auth/google?role=ADMIN");
      expect(resAdmin.status).toBe(302);
      expect(resAdmin.headers.location).toContain("state=PARTICULAR");

      const resInvalid = await request(app).get("/api/auth/google?role=SUPERUSER");
      expect(resInvalid.status).toBe(302);
      expect(resInvalid.headers.location).toContain("state=PARTICULAR");

      expect(capturedStates).toEqual(["INSTITUCION", "PARTICULAR", "PARTICULAR"]);
    });

    it("[Happy] googleCallback redirige a /oauth-success con un JWT válido en la URL principal", async () => {
      process.env.FRONTEND_URL = "https://cumpa.vercel.app/, https://otra-url.org";
      const user = await seedUser({ email: "oauth@cumpa.org", role: Role.VETERINARIA });

      let redirectedTo = "";
      const res: any = {
        redirect(url: string) {
          redirectedTo = url;
        },
      };

      await authController.googleCallback({ user } as any, res, vi.fn());

      expect(redirectedTo).toMatch(/^https:\/\/cumpa\.vercel\.app\/oauth-success\?token=/);
      const token = decodeURIComponent(redirectedTo.split("token=")[1]);
      const decoded = jwt.verify(token, TEST_JWT_SECRET) as any;
      expect(decoded.id).toBe(user.id);
      expect(decoded.email).toBe(user.email);
      expect(decoded.role).toBe(Role.VETERINARIA);
    });

    it("[Wrong/Edge] googleCallback redirige a /login?error=oauth_failed si req.user está ausente", async () => {
      process.env.FRONTEND_URL = "https://cumpa.vercel.app";

      let redirectedTo = "";
      const res: any = {
        redirect(url: string) {
          redirectedTo = url;
        },
      };

      await authController.googleCallback({} as any, res, vi.fn());
      expect(redirectedTo).toBe("https://cumpa.vercel.app/login?error=oauth_failed");
    });
  });
});
