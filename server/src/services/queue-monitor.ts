/**
 * Bull Board Queue Monitor
 *
 * Exposes a BullMQ dashboard at /admin/queues.
 * Queues are registered dynamically after initialization so the adapter
 * can be mounted in app.ts before the server starts.
 */

import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import type { Queue } from 'bullmq';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

const { addQueue } = createBullBoard({ queues: [], serverAdapter });

/**
 * Register a BullMQ queue with the dashboard.
 * Call this after each queue is initialized (e.g. inside TicketPdfQueueService.initialize).
 */
export function registerQueueForMonitoring(queue: Queue): void {
  addQueue(new BullMQAdapter(queue));
}

export { serverAdapter };
