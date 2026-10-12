import { Resend } from "resend";

class EmailService {
  private resend: Resend | null = null;
  private fromEmail: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey && apiKey.trim().length > 0 && !apiKey.includes("tu_resend_api_key")) {
      this.resend = new Resend(apiKey);
    } else {
      console.warn("⚠️ [ResendService] RESEND_API_KEY no configurada. Los emails se imprimirán en consola (Modo Mock).");
    }
    this.fromEmail = process.env.EMAIL_FROM || "Cumpa <notificaciones@cumpa.org>";
  }

  private async sendEmail(to: string, subject: string, html: string): Promise<{ id: string }> {
    if (!this.resend) {
      console.log(`\n📨 ===== [EMAIL ENVIADO (MODO DESARROLLO/MOCK)] =====`);
      console.log(`Para: ${to}`);
      console.log(`Asunto: ${subject}`);
      console.log(`Cuerpo HTML:\n${html}`);
      console.log(`====================================================\n`);
      return { id: `mock-${Date.now()}` };
    }

    try {
      const response = await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject,
        html,
      });

      if (response.error) {
        console.error("❌ Error al despachar correo vía Resend:", response.error);
        return { id: `failed-${Date.now()}` };
      }

      return { id: response.data?.id || `sent-${Date.now()}` };
    } catch (error) {
      console.error("❌ Error inesperado en Resend:", error);
      return { id: `failed-${Date.now()}` };
    }
  }

  /**
   * Envío de correo con enlace de verificación de cuenta
   */
  async sendVerificationEmail(to: string, name: string, token: string): Promise<{ id: string }> {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const verifyUrl = `${frontendUrl}/verificar-cuenta?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f46e5;">¡Bienvenido/a a Cumpa, ${name}! 🐾</h2>
        <p>Gracias por sumarte a nuestra comunidad de rescate y adopción responsable.</p>
        <p>Para activar tu cuenta y poder iniciar sesión en la aplicación, por favor confirma tu dirección de correo electrónico haciendo clic en el siguiente botón:</p>
        <div style="margin: 25px 0;">
          <a href="${verifyUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Confirmar y Activar Cuenta
          </a>
        </div>
        <p style="color: #64748b; font-size: 14px;">Al hacer clic, tu correo quedará verificado automáticamente y podrás ingresar con tus credenciales.</p>
        <p style="color: #64748b; font-size: 12px; word-break: break-all;">${verifyUrl}</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">Si no solicitaste esta cuenta en Cumpa, puedes desestimar este mensaje.</p>
      </div>
    `;

    return this.sendEmail(to, "Verifica tu cuenta en Cumpa 🐾", html);
  }

  /**
   * Envío de token para restablecimiento de contraseña
   */
  async sendPasswordResetEmail(to: string, name: string, token: string): Promise<{ id: string }> {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/restablecer-clave?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f46e5;">Restablecimiento de Contraseña 🔒</h2>
        <p>Hola, ${name}. Recibimos una solicitud para restablecer la contraseña de tu cuenta en Cumpa.</p>
        <p>Haz clic en el siguiente botón para generar una nueva clave (este enlace vence en 1 hora):</p>
        <div style="margin: 25px 0;">
          <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Restablecer Contraseña
          </a>
        </div>
        <p style="color: #64748b; font-size: 12px; word-break: break-all;">${resetUrl}</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">Si no solicitaste este cambio, ignora este correo de forma segura.</p>
      </div>
    `;

    return this.sendEmail(to, "Restablece tu contraseña — Cumpa 🐾", html);
  }

  /**
   * Notificación al publicador sobre una nueva postulación
   */
  async sendNewApplicationNotice(
    to: string,
    publisherName: string,
    animalName: string,
    applicantName: string
  ): Promise<{ id: string }> {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const dashboardUrl = `${frontendUrl}/panel/postulaciones`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #059669;">¡Nueva postulación recibida para ${animalName}! 🐶🐱</h2>
        <p>Hola, ${publisherName}. El usuario <strong>${applicantName}</strong> se ha postulado para adoptar o brindar tránsito a <strong>${animalName}</strong>.</p>
        <p>Puedes revisar los detalles de la solicitud y sus datos de contacto en tu panel:</p>
        <div style="margin: 25px 0;">
          <a href="${dashboardUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Ver Postulaciones
          </a>
        </div>
      </div>
    `;

    return this.sendEmail(to, `Nueva postulación para ${animalName} — Cumpa`, html);
  }

  /**
   * Constancia al adoptante de que su postulación fue remitida
   */
  async sendApplicationConfirmationNotice(
    to: string,
    applicantName: string,
    animalName: string
  ): Promise<{ id: string }> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f46e5;">Postulación enviada con éxito 🎉</h2>
        <p>Hola, ${applicantName}. Tu postulación para <strong>${animalName}</strong> ha sido enviada al rescatista/publicador.</p>
        <p>El responsable revisará tu mensaje y se pondrá en contacto contigo o actualizará el estado de la postulación en la plataforma.</p>
        <p>¡Muchas gracias por tu compromiso con los animales!</p>
      </div>
    `;

    return this.sendEmail(to, `Postulación registrada para ${animalName} — Cumpa`, html);
  }

  /**
   * Notificación de resolución de postulación
   */
  async sendApplicationStatusChangeNotice(
    to: string,
    applicantName: string,
    animalName: string,
    status: string,
    reason?: string
  ): Promise<{ id: string }> {
    const isApproved = status === "APROBADA";
    const color = isApproved ? "#059669" : "#dc2626";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: ${color};">Actualización sobre tu postulación para ${animalName}</h2>
        <p>Hola, ${applicantName}. Te informamos que el estado de tu solicitud para <strong>${animalName}</strong> ha cambiado a: <strong>${status}</strong>.</p>
        ${reason ? `<p><strong>Motivo/Comentarios:</strong> ${reason}</p>` : ""}
        ${isApproved ? `<p>¡Felicitaciones! El publicador se comunicará para coordinar la entrega y el proceso de seguimiento a 6 meses.</p>` : ""}
      </div>
    `;

    return this.sendEmail(to, `Estado de postulación para ${animalName}: ${status}`, html);
  }

  /**
   * Recordatorio preventivo de foto mensual de seguimiento
   */
  async sendFollowUpReminderEmail(
    to: string,
    adopterName: string,
    animalName: string,
    monthNumber: number,
    dueDate: Date
  ): Promise<{ id: string }> {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const reportUrl = `${frontendUrl}/seguimientos`;
    const formattedDate = dueDate.toLocaleDateString("es-AR");

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #d97706;">Recordatorio de Seguimiento Mensual 📸</h2>
        <p>Hola, ${adopterName}. Se aproxima la fecha límite para el reporte del <strong>Mes ${monthNumber}</strong> de <strong>${animalName}</strong> (${formattedDate}).</p>
        <p>Por favor recuerda ingresar a la plataforma y subir una foto actualizada del animal para constatar su bienestar y adaptación.</p>
        <div style="margin: 25px 0;">
          <a href="${reportUrl}" style="background-color: #d97706; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Subir Reporte del Mes ${monthNumber}
          </a>
        </div>
      </div>
    `;

    return this.sendEmail(to, `Recordatorio: Reporte mensual ${monthNumber} de ${animalName} — Cumpa`, html);
  }

  /**
   * Alerta urgente por mora en reporte de seguimiento
   */
  async sendFollowUpAlertEmail(
    to: string,
    guardianName: string,
    animalName: string,
    monthNumber: number,
    adopterName: string
  ): Promise<{ id: string }> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #dc2626;">Alerta de Incumplimiento de Seguimiento ⚠️</h2>
        <p>Hola, ${guardianName}. Te informamos que el reporte del <strong>Mes ${monthNumber}</strong> correspondiente a la adopción de <strong>${animalName}</strong> por parte de <strong>${adopterName}</strong> ha vencido sin haber sido presentado.</p>
        <p>El sistema ha marcado el expediente en estado de mora. Te recomendamos contactar directamente al adoptante para chequear la situación del animal.</p>
      </div>
    `;

    return this.sendEmail(to, `Alerta de mora: Reporte ${monthNumber} de ${animalName} vencido`, html);
  }

  /**
   * Dictamen de verificación institucional de CUIT
   */
  async sendInstitutionalVerificationNotice(
    to: string,
    institutionName: string,
    status: "APROBADA" | "RECHAZADA",
    notes?: string
  ): Promise<{ id: string }> {
    const isApproved = status === "APROBADA";
    const color = isApproved ? "#059669" : "#dc2626";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: ${color};">Dictamen de Verificación Institucional</h2>
        <p>Estimados representantes de <strong>${institutionName}</strong>:</p>
        <p>La administración de Cumpa ha revisado su personería jurídica y documentación legal.</p>
        <p>El dictamen final es: <strong>${status}</strong>.</p>
        ${notes ? `<p><strong>Observaciones:</strong> ${notes}</p>` : ""}
        ${isApproved ? `<p>A partir de este momento, su cuenta cuenta con insignia de verificación y habilitación plena para publicar animales.</p>` : `<p>Si consideran que hubo un error o necesitan adjuntar nueva documentación, pueden actualizar su solicitud desde el panel institucional.</p>`}
      </div>
    `;

    return this.sendEmail(to, `Resultado de Verificación Institucional: ${status} — Cumpa`, html);
  }

  /**
   * Notificación de confirmación tras actualización exitosa de contraseña
   */
  async sendPasswordChangedNotice(to: string, name: string): Promise<{ id: string }> {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const helpUrl = `${frontendUrl}/contacto`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #059669;">Contraseña actualizada con éxito 🔒</h2>
        <p>Hola, ${name}. Te confirmamos que la contraseña de tu cuenta en Cumpa ha sido modificada correctamente.</p>
        <p>Si realizaste este cambio, puedes ignorar este mensaje e iniciar sesión normalmente con tus nuevas credenciales.</p>
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 12px; margin: 20px 0;">
          <p style="color: #b91c1c; font-weight: bold; margin: 0 0 8px 0;">¿No reconoces esta actividad?</p>
          <p style="color: #7f1d1d; font-size: 13px; margin: 0;">Si no solicitaste este cambio, tu cuenta podría estar comprometida. Por favor contáctanos de inmediato para protegerla:</p>
          <div style="margin-top: 10px;">
            <a href="${helpUrl}" style="background-color: #dc2626; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 13px; display: inline-block;">
              Contactar a Soporte
            </a>
          </div>
        </div>
      </div>
    `;

    return this.sendEmail(to, "Confirmación de cambio de contraseña — Cumpa 🐾", html);
  }

  /**
   * Alerta crítica por reporte en estado INCUMPLIDO (escalamiento a ALERTA_DISPARADA)
   */
  async sendFollowUpBreachCriticalEmail(
    to: string,
    guardianName: string,
    animalName: string,
    monthNumber: number,
    adopterName: string
  ): Promise<{ id: string }> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #b91c1c;">ALERTA CRÍTICA: Incumplimiento Grave de Seguimiento 🚨</h2>
        <p>Hola, ${guardianName}. Te informamos que el reporte del <strong>Mes ${monthNumber}</strong> para <strong>${animalName}</strong> a cargo del adoptante <strong>${adopterName}</strong> supera los 14 días de atraso y ha sido clasificado formalmente como <strong>INCUMPLIDO</strong>.</p>
        <p>El expediente de adopción ha pasado al estado de máxima gravedad: <strong>ALERTA DISPARADA</strong>.</p>
        <p>Se recomienda contactar al adoptante de forma inmediata, realizar una visita de control presencial o evaluar una denuncia ciudadana si se presume riesgo de maltrato o desamparo.</p>
      </div>
    `;

    return this.sendEmail(to, `🚨 ALERTA CRÍTICA: Seguimiento de ${animalName} en ALERTA DISPARADA`, html);
  }
}

export const emailService = new EmailService();
export default emailService;
