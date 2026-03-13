import { submitMessage } from "./hedera";

export type JobEvent =
  | "job_created"
  | "job_funded"
  | "job_in_progress"
  | "job_delivered"
  | "escrow_released"
  | "job_rated";

export async function logToHcs(
  jobId: string,
  hcsTopicId: string | null,
  event: JobEvent,
  data?: Record<string, unknown>
): Promise<void> {
  if (!hcsTopicId) return;

  try {
    const message = JSON.stringify({
      event,
      jobId,
      timestamp: Date.now(),
      ...data,
    });
    await submitMessage(hcsTopicId, message);
  } catch (error) {
    console.error(`[hcs] Failed to log ${event} for job ${jobId}:`, error);
  }
}
