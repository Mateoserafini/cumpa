import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import nodemailer from "nodemailer";
import { EmailService } from "../modules/notifications/email.service";

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(),
  },
}));

describe("EmailService Unit Tests (Nodemailer / Gmail SMTP)", () => {
  const originalEnv = process.env;
  let mockSendMail: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    mockSendMail = vi.fn().mockResolvedValue({ messageId: "<mock-msg-id-123@gmail.com>" });
    vi.mocked(nodemailer.createTransport).mockReturnValue({
      sendMail: mockSendMail,
    } as any);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("debe operar en Modo Mock sin crear transporter si SMTP_USER o SMTP_PASS no están configurados", async () => {
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;

    const service = new EmailService();
    expect(nodemailer.createTransport).not.toHaveBeenCalled();

    const result = await service.sendVerificationEmail("usuario@test.com", "Ana", "token-123");
    expect(result.id).toMatch(/^mock-/);
    expect(result.success).toBe(true);
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it("debe configurar el transporter con Gmail SMTP (puerto 465 secure=true) y llamar a sendMail con los parámetros correctos", async () => {
    process.env.SMTP_HOST = "smtp.gmail.com";
    process.env.SMTP_PORT = "465";
    process.env.SMTP_USER = "cumpa.notificaciones@gmail.com";
    process.env.SMTP_PASS = "abcd efgh ijkl mnop";
    process.env.EMAIL_FROM = "Cumpa <cumpa.notificaciones@gmail.com>";
    process.env.FRONTEND_URL = "http://localhost:5173";

    const service = new EmailService();

    const result = await service.sendVerificationEmail(
      "adoptante@ejemplo.com",
      "Mateo",
      "token-verificacion-xyz"
    );

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "cumpa.notificaciones@gmail.com",
        pass: "abcdefghijklmnop",
      },
    });

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Cumpa <cumpa.notificaciones@gmail.com>",
        to: "adoptante@ejemplo.com",
        subject: "Verifica tu cuenta en Cumpa 🐾",
        html: expect.stringContaining(
          "http://localhost:5173/verificar-cuenta?token=token-verificacion-xyz"
        ),
      })
    );
    expect(result).toEqual({
      id: "<mock-msg-id-123@gmail.com>",
      success: true,
    });
  });

  it("debe configurar secure=false cuando se utiliza el puerto 587 (STARTTLS)", async () => {
    process.env.SMTP_HOST = "smtp.gmail.com";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "cumpa.notificaciones@gmail.com";
    process.env.SMTP_PASS = "abcd efgh ijkl mnop";

    const service = new EmailService();
    await service.sendVerificationEmail("test@test.com", "Test", "token");

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "cumpa.notificaciones@gmail.com",
        pass: "abcdefghijklmnop",
      },
    });
  });

  it("debe enviar correctamente todos los tipos de notificaciones transaccionales", async () => {
    process.env.SMTP_USER = "cumpa.notificaciones@gmail.com";
    process.env.SMTP_PASS = "abcd efgh ijkl mnop";

    const service = new EmailService();

    await service.sendPasswordResetEmail("user@test.com", "Juan", "reset-tok-1");
    expect(mockSendMail).toHaveBeenLastCalledWith(
      expect.objectContaining({
        to: "user@test.com",
        subject: "Restablece tu contraseña — Cumpa 🐾",
        html: expect.stringContaining("reset-tok-1"),
      })
    );

    await service.sendNewApplicationNotice("pub@test.com", "Refugio Sur", "Firulais", "Pedro");
    expect(mockSendMail).toHaveBeenLastCalledWith(
      expect.objectContaining({
        to: "pub@test.com",
        subject: "Nueva postulación para Firulais — Cumpa",
        html: expect.stringContaining("Pedro"),
      })
    );

    await service.sendApplicationConfirmationNotice("adopt@test.com", "Pedro", "Firulais");
    expect(mockSendMail).toHaveBeenLastCalledWith(
      expect.objectContaining({
        to: "adopt@test.com",
        subject: "Postulación registrada para Firulais — Cumpa",
      })
    );

    await service.sendApplicationStatusChangeNotice(
      "adopt@test.com",
      "Pedro",
      "Firulais",
      "APROBADA"
    );
    expect(mockSendMail).toHaveBeenLastCalledWith(
      expect.objectContaining({
        to: "adopt@test.com",
        subject: "Estado de postulación para Firulais: APROBADA",
      })
    );

    await service.sendFollowUpReminderEmail(
      "adopt@test.com",
      "Pedro",
      "Firulais",
      2,
      new Date("2026-12-01T00:00:00Z")
    );
    expect(mockSendMail).toHaveBeenLastCalledWith(
      expect.objectContaining({
        to: "adopt@test.com",
        subject: "Recordatorio: Reporte mensual 2 de Firulais — Cumpa",
      })
    );

    await service.sendFollowUpAlertEmail("guard@test.com", "Laura", "Firulais", 2, "Pedro");
    expect(mockSendMail).toHaveBeenLastCalledWith(
      expect.objectContaining({
        to: "guard@test.com",
        subject: "Alerta de mora: Reporte 2 de Firulais vencido",
      })
    );

    await service.sendInstitutionalVerificationNotice(
      "ong@test.com",
      "Fundación Patitas",
      "APROBADA",
      "Documentación verificada"
    );
    expect(mockSendMail).toHaveBeenLastCalledWith(
      expect.objectContaining({
        to: "ong@test.com",
        subject: "Resultado de Verificación Institucional: APROBADA — Cumpa",
      })
    );

    await service.sendPasswordChangedNotice("user@test.com", "Juan");
    expect(mockSendMail).toHaveBeenLastCalledWith(
      expect.objectContaining({
        to: "user@test.com",
        subject: "Confirmación de cambio de contraseña — Cumpa 🐾",
      })
    );

    await service.sendFollowUpBreachCriticalEmail(
      "guard@test.com",
      "Laura",
      "Firulais",
      2,
      "Pedro"
    );
    expect(mockSendMail).toHaveBeenLastCalledWith(
      expect.objectContaining({
        to: "guard@test.com",
        subject: "🚨 ALERTA CRÍTICA: Seguimiento de Firulais en ALERTA DISPARADA",
      })
    );

    expect(mockSendMail).toHaveBeenCalledTimes(9);
  });

  it("debe capturar errores de conexión/autenticación SMTP sin lanzar excepciones para no derribar la aplicación", async () => {
    process.env.SMTP_USER = "cumpa.notificaciones@gmail.com";
    process.env.SMTP_PASS = "clave_invalida";

    const smtpAuthError = new Error("Invalid login: 535-5.7.8 Username and Password not accepted");
    mockSendMail.mockRejectedValueOnce(smtpAuthError);

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const service = new EmailService();
    const result = await service.sendVerificationEmail("destino@test.com", "Lucas", "tok-999");

    expect(result.id).toMatch(/^failed-/);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Username and Password not accepted");
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});

