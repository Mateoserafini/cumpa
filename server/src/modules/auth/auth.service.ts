import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import prisma from "../../config/prisma";
import { HttpError } from "../../middlewares/errorHandler.middleware";
import emailService from "../notifications/resend.service";
import { getJwtSecret } from "../../config/jwt";
import { loginRateLimiter } from "../../middlewares/rateLimiter.middleware";
import { Role, User } from "@prisma/client";
import { JwtUserPayload } from "../../types";

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role: Role;
  province: string;
  city: string;
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  /**
   * Genera un token JWT para un usuario
   */
  public generateToken(user: Pick<User, "id" | "email" | "role">): string {
    const secret = getJwtSecret();
    const expiresIn = (process.env.JWT_EXPIRES_IN || "7d") as jwt.SignOptions["expiresIn"];

    const payload: JwtUserPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, secret, { expiresIn });
  }

  /**
   * Registro de un nuevo usuario
   */
  async register(data: RegisterInput): Promise<{ message: string; userId: string }> {
    const existingUser = await prisma.user.findFirst({
      where: {
        email: data.email,
        deletedAt: null,
      },
    });

    if (existingUser) {
      throw new HttpError(409, "Ya existe una cuenta registrada con este correo electrónico.");
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        role: data.role,
        province: data.province,
        city: data.city,
        phone: data.phone,
        verificationToken,
        isEmailVerified: false,
      },
    });

    // Despacho de email de verificación asíncrono
    emailService.sendVerificationEmail(newUser.email, newUser.name, verificationToken).catch((err) => {
      console.error("Error al enviar email de verificación:", err);
    });

    return {
      message: "Usuario registrado con éxito. Revise su casilla de correo para verificar su cuenta.",
      userId: newUser.id,
    };
  }

  /**
   * Inicio de sesión tradicional con credenciales
   */
  async login(
    data: LoginInput,
    clientIp: string = "127.0.0.1"
  ): Promise<{
    token: string;
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      isEmailVerified: boolean;
      avatarUrl: string | null;
    };
  }> {
    // 1. Verificar si la IP/email superó los 3 intentos fallidos
    if (loginRateLimiter.isBlocked(clientIp, data.email)) {
      throw new HttpError(
        429,
        "Ha superado el límite de 3 intentos fallidos de inicio de sesión. Por motivos de seguridad, espere 15 minutos o solicite ayuda restableciendo su clave mediante 'Olvidé mi contraseña'."
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        email: data.email,
        deletedAt: null,
      },
    });

    if (!user || !user.passwordHash) {
      loginRateLimiter.recordFailure(clientIp, data.email);
      throw new HttpError(401, "Credenciales inválidas. Verifique su email y contraseña.");
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      loginRateLimiter.recordFailure(clientIp, data.email);
      throw new HttpError(401, "Credenciales inválidas. Verifique su email y contraseña.");
    }

    // 2. Exigir correo verificado para cuentas registradas por flujo tradicional (no Google)
    if (!user.isEmailVerified) {
      throw new HttpError(
        403,
        "Debe verificar su dirección de correo electrónico antes de iniciar sesión. Revise su casilla de correo o solicite un nuevo enlace de confirmación."
      );
    }

    // 3. Autenticación exitosa: resetear contador de fallos
    loginRateLimiter.reset(clientIp, data.email);

    const token = this.generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  /**
   * Verificación de correo electrónico con token
   */
  async verifyEmail(token: string): Promise<{ message: string; verified: boolean }> {
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new HttpError(400, "El token de verificación es inválido o ya fue utilizado.");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationToken: null,
      },
    });

    return {
      message: "Su dirección de correo electrónico ha sido verificada exitosamente. Ya puede iniciar sesión en la aplicación.",
      verified: true,
    };
  }

  /**
   * Solicitud de restablecimiento de contraseña
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: resetToken,
          resetPasswordExpires: expires,
        },
      });

      emailService.sendPasswordResetEmail(user.email, user.name, resetToken).catch((err) => {
        console.error("Error al enviar email de restablecimiento:", err);
      });
    }

    // Respuesta neutra por seguridad (anti-enumeración de usuarios)
    return {
      message: "Si la dirección de correo coincide con una cuenta activa, recibirá las instrucciones para restablecer su clave.",
    };
  }

  /**
   * Aplicación del nuevo password con token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() },
        deletedAt: null,
      },
    });

    if (!user) {
      throw new HttpError(400, "El token de restablecimiento es inválido o ha expirado.");
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    // Despacho asíncrono de correo de confirmación de clave actualizada
    emailService.sendPasswordChangedNotice(user.email, user.name).catch((err) => {
      console.error("Error al enviar confirmación de cambio de contraseña:", err);
    });

    // Resetear bloqueo de rate limiter para este correo
    loginRateLimiter.reset(undefined, user.email);

    return {
      message: "Su contraseña ha sido actualizada con éxito. Ya puede iniciar sesión con sus nuevas credenciales.",
    };
  }

  /**
   * Reenvío de correo de activación de cuenta
   */
  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const user = await prisma.user.findFirst({
      where: {
        email,
        deletedAt: null,
      },
    });

    if (user && !user.isEmailVerified) {
      const verificationToken = crypto.randomBytes(32).toString("hex");
      await prisma.user.update({
        where: { id: user.id },
        data: { verificationToken },
      });

      emailService.sendVerificationEmail(user.email, user.name, verificationToken).catch((err) => {
        console.error("Error al reenviar email de verificación:", err);
      });
    }

    return {
      message: "Si la dirección coincide con una cuenta pendiente de verificación, se ha enviado un nuevo enlace de activación a su casilla.",
    };
  }

  /**
   * Obtener perfil actual del usuario autenticado
   */
  async getMe(userId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        institutionalProfile: true,
      },
    });

    if (!user) {
      throw new HttpError(404, "Usuario no encontrado.");
    }

    const { passwordHash, verificationToken, resetPasswordToken, resetPasswordExpires, ...safeUser } = user;
    return safeUser;
  }
}

export const authService = new AuthService();
export default authService;
