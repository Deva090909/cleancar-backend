/**
 * notification.worker.ts — BullMQ processor for the "notifications" queue
 *
 * Handles: IN_APP (already stored), SMS via console log stub,
 *          EMAIL via console log stub, WHATSAPP via console log stub.
 * Replace console.log with real gateway calls (Twilio, SendGrid, etc.)
 */
import { Worker, Job } from "bullmq";
import { ConfigService } from "@nestjs/config";

const config = new ConfigService();
const redisUrl = config.get<string>("app.redisUrl") ?? "redis://localhost:6379";
const url = new URL(redisUrl);
const connection = { host: url.hostname, port: Number(url.port) || 6379, password: url.password || undefined };

export const notificationWorker = new Worker(
  "notifications",
  async (job: Job) => {
    const { employeeId, title, body, channel, type } = job.data;
    switch (channel) {
      case "SMS":
        // TODO: Twilio / MSG91 integration
        console.log(`[SMS] To employee ${employeeId}: ${title} — ${body}`);
        break;
      case "EMAIL":
        // TODO: SendGrid / SES integration
        console.log(`[EMAIL] To employee ${employeeId}: ${title}`);
        break;
      case "WHATSAPP":
        // TODO: WhatsApp Business API
        console.log(`[WHATSAPP] To employee ${employeeId}: ${title}`);
        break;
      case "IN_APP":
      default:
        // Already persisted in DB — nothing to do
        break;
    }
    return { delivered: true };
  },
  { connection, concurrency: 10 }
);

notificationWorker.on("completed", job => console.log(`[NotifWorker] Job ${job.id} done`));
notificationWorker.on("failed", (job, err) => console.error(`[NotifWorker] Job ${job?.id} failed:`, err.message));
