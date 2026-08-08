import { trubitFetch } from './api';

/**
 * Trubit Zero-Lag Telemetry Engine
 * 
 * Queues events and dispatches them when the browser's main thread is completely idle.
 * This guarantees that heavy analytics tracking never causes UI stuttering or dropped frames.
 */

type TelemetryEvent = {
  eventName: string;
  payload: Record<string, any>;
  timestamp: number;
};

let eventQueue: TelemetryEvent[] = [];
let isProcessing = false;

/**
 * Pushes an event into the idle queue.
 */
export function trackEvent(eventName: string, payload: Record<string, any> = {}) {
  eventQueue.push({
    eventName,
    payload,
    timestamp: Date.now(),
  });

  scheduleProcessing();
}

function scheduleProcessing() {
  if (isProcessing || eventQueue.length === 0) return;

  // Use requestIdleCallback if available, fallback to setTimeout
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(processQueue, { timeout: 2000 });
  } else {
    setTimeout(processQueue, 100);
  }
}

async function processQueue(deadline?: any) {
  isProcessing = true;

  while (eventQueue.length > 0) {
    // If we're out of idle time (and didn't time out), yield back to the browser
    if (deadline && deadline.timeRemaining() <= 0 && !deadline.didTimeout) {
      break;
    }

    const event = eventQueue.shift();
    if (event) {
      await dispatchEvent(event);
    }
  }

  isProcessing = false;
  if (eventQueue.length > 0) {
    scheduleProcessing();
  }
}

/**
 * The actual payload dispatcher. Fires to BOTH Google Analytics and Custom Backend.
 */
async function dispatchEvent(event: TelemetryEvent) {
  try {
    // 1. Dispatch to Google Analytics (GA4)
    if (typeof window !== 'undefined' && typeof (window as any).gtag === 'function') {
      (window as any).gtag('event', event.eventName, {
        ...event.payload,
        send_to: 'G-XXXXXXXXXX', // Note: Ideally loaded from env
      });
    }

    // 2. Dispatch to Custom Backend API
    // We wrap this in a try-catch so a failed backend call doesn't break the queue
    try {
      // Intentionally fire-and-forget to avoid blocking idle time on network waits
      trubitFetch('/telemetry/track', {
        method: 'POST',
        body: JSON.stringify(event)
      }).catch(err => {
        // Silently fail telemetry network errors to avoid console spam
        // console.debug('Telemetry backend sync failed', err);
      });
    } catch (err) {
      // Ignore
    }

  } catch (error) {
    console.error(`[Telemetry Engine] Failed to dispatch event ${event.eventName}`, error);
  }
}
