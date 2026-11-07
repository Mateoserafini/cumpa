import path from "path";
import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import emailService from "../src/modules/notifications/email.service";

async function run() {
  const targetEmail = process.env.SMTP_USER || "matuserafini@gmail.com";
  console.log(`\n🐾 [Test Email] Iniciando prueba de despacho a: ${targetEmail}`);
  console.log(`Configuración: HOST=${process.env.SMTP_HOST || "smtp.gmail.com"}, PORT=${process.env.SMTP_PORT || 465}, USER=${process.env.SMTP_USER}\n`);

  try {
    const result = await emailService.sendVerificationEmail(
      targetEmail,
      "Mateo",
      "token-de-prueba-123456"
    );

    if (result.success) {
      console.log(`\n🎉 Correo de prueba enviado exitosamente!`);
      console.log(`MessageId: ${result.id}`);
      console.log(`Revisa la bandeja de entrada o spam de: ${targetEmail}\n`);
    } else {
      console.error(`\n❌ Error en el envío:`, result.error);
    }
  } catch (error) {
    console.error(`\n❌ Excepción inesperada:`, error);
  }
}

run();

