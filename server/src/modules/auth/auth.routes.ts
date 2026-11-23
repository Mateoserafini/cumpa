import { Router } from "express";
import passport from "passport";
import authController from "./auth.controller";
import {
  registerValidation,
  loginValidation,
  verifyEmailValidation,
  resendVerificationValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} from "./auth.validation";
import { validateRequest } from "../../middlewares/validateRequest.middleware";
import { authenticateToken } from "../../middlewares/auth.middleware";
import { loginRateLimiterMiddleware } from "../../middlewares/rateLimiter.middleware";

const router = Router();

// Registro e inicio de sesión tradicional (con rate limiting de 3 intentos fallidos)
router.post("/register", registerValidation, validateRequest, authController.register);
router.post("/login", loginRateLimiterMiddleware, loginValidation, validateRequest, authController.login);

// Verificación de email y reseteo de password
router.get("/verify-email/:token", verifyEmailValidation, validateRequest, authController.verifyEmail);
router.post("/resend-verification", resendVerificationValidation, validateRequest, authController.resendVerification);
router.post("/forgot-password", forgotPasswordValidation, validateRequest, authController.forgotPassword);
router.post("/reset-password", resetPasswordValidation, validateRequest, authController.resetPassword);

// Sesión actual
router.get("/me", authenticateToken, authController.getMe);

// Google OAuth 2.0
function isGoogleConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    !process.env.GOOGLE_CLIENT_ID.includes("tu_google") &&
    process.env.GOOGLE_CLIENT_ID.trim().length > 0
  );
}

router.get("/google", (req, res, next) => {
  if (!isGoogleConfigured()) {
    res.status(501).json({
      message: "Google OAuth no se encuentra configurado en este entorno.",
    });
    return;
  }
  passport.authenticate("google", { scope: ["profile", "email"], session: false })(req, res, next);
});

router.get(
  "/google/callback",
  (req, res, next) => {
    if (!isGoogleConfigured()) {
      res.status(501).json({
        message: "Google OAuth no se encuentra configurado en este entorno.",
      });
      return;
    }
    const failureRedirectUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=oauth_failed`;
    passport.authenticate("google", { session: false, failureRedirect: failureRedirectUrl })(
      req,
      res,
      next
    );
  },
  authController.googleCallback
);

export default router;
