import { Request, Response, NextFunction } from "express";
import authService from "./auth.service";
import { User } from "@prisma/client";
import { getPrimaryFrontendUrl } from "../../utils/frontendUrl";

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || "127.0.0.1";
      const result = await authService.login(req.body, clientIp);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = String(req.params.token);
      const result = await authService.verifyEmail(token);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async resendVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      const result = await authService.resendVerificationEmail(email);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, newPassword } = req.body;
      const result = await authService.resetPassword(token, newPassword);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getMe(req.user!.id);
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  async googleCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user as unknown as User | undefined;
      const frontendUrl = getPrimaryFrontendUrl();
      if (!user || !user.id) {
        res.redirect(`${frontendUrl}/login?error=oauth_failed`);
        return;
      }
      const token = authService.generateToken(user);
      // Redirige al frontend con el token JWT
      res.redirect(`${frontendUrl}/oauth-success?token=${encodeURIComponent(token)}`);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
export default authController;
