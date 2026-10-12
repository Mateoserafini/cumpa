import { startFollowUpReminderJob } from "./followupReminder.job";
import { startFollowUpBreachAlertJob } from "./followupBreachAlert.job";
import { startTokenCleanupJob } from "./tokenCleanup.job";

export function initJobs(): void {
  if (process.env.NODE_ENV === "test") return;

  console.log("🕒 Inicializando tareas programadas en segundo plano (Cron Jobs)...");
  startFollowUpReminderJob();
  startFollowUpBreachAlertJob();
  startTokenCleanupJob();
  console.log("✅ Cron Jobs inicializados con éxito.");
}
