const EmailQueue = require('../models/EmailQueue');
const { sendVerificationEmail, sendPasswordResetEmail, sendNotificationEmail } = require('./emailService');

/**
 * Email Worker — Background Sequential Processor
 * 
 * Architecture:
 * ┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌─────────────┐
 * │  HTTP Req    │ ──► │ emailQueue   │ ──► │  MongoDB     │ ──► │ emailWorker │ ──► SMTP
 * │ (instant)    │     │ (enqueue)    │     │ (durable)    │     │ (throttled) │
 * └─────────────┘     └──────────────┘     └──────────────┘     └─────────────┘
 * 
 * Design decisions:
 * 1. SEQUENTIAL PROCESSING — Only one email is sent at a time. This guarantees
 *    we never exceed Stalwart's rate limit of 5 emails/sec.
 * 2. SAFE SEND RATE — 300ms delay between sends (~3.3 emails/sec), with a 34%
 *    safety margin under the 5/sec Stalwart IP throttle for guaranteed delivery.
 * 3. EXPONENTIAL BACKOFF — On SMTP failure, retries are delayed exponentially:
 *    attempt 1 = 30s, attempt 2 = 2min, attempt 3 = 8min, attempt 4 = 32min, attempt 5 = 2h.
 * 4. ATOMIC CLAIM — Uses findOneAndUpdate with status: 'PENDING' → 'PROCESSING'
 *    to prevent duplicate processing, even if multiple server instances run.
 * 5. CRASH RECOVERY — On startup, resets any stuck 'PROCESSING' jobs back to
 *    'PENDING' (they were interrupted by a server crash/restart).
 * 6. POLLING LOOP — Polls MongoDB every 2 seconds for new jobs. This is
 *    extremely lightweight (~1 indexed query/2sec) and doesn't require Redis
 *    pub/sub or external dependencies.
 */

// Configuration
const SEND_DELAY_MS = 300;       // Delay between consecutive sends (ms) → ~3.3 emails/sec
const POLL_INTERVAL_MS = 2000;   // How often to check for new jobs (ms)
const MAX_ATTEMPTS = 5;          // Maximum retry attempts before marking FAILED
const BATCH_SIZE = 20;           // Max jobs to process per poll cycle

let isRunning = false;
let pollTimer = null;

/**
 * Calculate exponential backoff delay for retry attempts.
 * attempt 1 →  30s, attempt 2 →  2m, attempt 3 →  8m, attempt 4 → 32m, attempt 5 → 2h
 */
const getBackoffDelay = (attempt) => {
  return Math.min(30000 * Math.pow(4, attempt - 1), 2 * 60 * 60 * 1000); // Cap at 2 hours
};

/**
 * Send a single email based on its queue job type.
 * Returns true on success, throws on failure.
 */
const processJob = async (job) => {
  const { type, payload } = job;

  switch (type) {
    case 'VERIFICATION':
      await sendVerificationEmail(payload.email, payload.name, payload.token, payload.portal);
      return true;

    case 'PASSWORD_RESET':
      await sendPasswordResetEmail(payload.email, payload.name, payload.token, payload.portal);
      return true;

    case 'NOTIFICATION': {
      // Reconstruct a notification-like object for sendNotificationEmail
      const notificationDoc = {
        _id: payload.notificationId,
        recipient: payload.recipient,
        roleScope: payload.roleScope,
        department: payload.department,
        title: payload.title,
        message: payload.message,
        link: payload.link,
        source: payload.source
      };
      await sendNotificationEmail(notificationDoc);
      return true;
    }

    default:
      throw new Error(`Unknown email job type: ${type}`);
  }
};

/**
 * Process a single batch of pending email jobs.
 */
const processBatch = async () => {
  const now = new Date();

  // Fetch and atomically claim up to BATCH_SIZE pending jobs
  // Priority order: lower priority number first, then oldest first
  for (let i = 0; i < BATCH_SIZE; i++) {
    const job = await EmailQueue.findOneAndUpdate(
      {
        status: 'PENDING',
        nextAttemptAt: { $lte: now }
      },
      {
        $set: { status: 'PROCESSING' }
      },
      {
        sort: { priority: 1, createdAt: 1 },
        returnDocument: 'after'
      }
    );

    if (!job) {
      // No more pending jobs
      break;
    }

    try {
      await processJob(job);

      // Mark as sent
      job.status = 'SENT';
      job.sentAt = new Date();
      job.attempts += 1;
      await job.save();

    } catch (err) {
      const newAttempts = job.attempts + 1;

      if (newAttempts >= job.maxAttempts) {
        // Exhausted all retries — mark as permanently failed
        job.status = 'FAILED';
        job.attempts = newAttempts;
        job.lastError = err.message || String(err);
        await job.save();
        console.error(`📧❌ Email job ${job._id} permanently failed after ${newAttempts} attempts: ${err.message}`);
      } else {
        // Schedule retry with exponential backoff
        const backoffMs = getBackoffDelay(newAttempts);
        job.status = 'PENDING';
        job.attempts = newAttempts;
        job.lastError = err.message || String(err);
        job.nextAttemptAt = new Date(Date.now() + backoffMs);
        await job.save();
        console.warn(`📧🔄 Email job ${job._id} failed (attempt ${newAttempts}/${job.maxAttempts}), retrying in ${Math.round(backoffMs / 1000)}s: ${err.message}`);
      }
    }

    // Throttle: wait between sends to stay under Stalwart's rate limit
    await sleep(SEND_DELAY_MS);
  }
};

/**
 * Main polling loop. Runs continuously while isRunning is true.
 */
const poll = async () => {
  if (!isRunning) return;

  try {
    await processBatch();
  } catch (err) {
    console.error('📧 Email worker poll error:', err);
  }

  // Schedule next poll
  if (isRunning) {
    pollTimer = setTimeout(poll, POLL_INTERVAL_MS);
  }
};

/**
 * Start the email worker. Safe to call multiple times (idempotent).
 */
const startEmailWorker = async () => {
  if (isRunning) {
    console.log('📧 Email worker is already running.');
    return;
  }

  isRunning = true;

  // Crash recovery: reset any stuck PROCESSING jobs back to PENDING
  const stuckJobs = await EmailQueue.updateMany(
    { status: 'PROCESSING' },
    { $set: { status: 'PENDING' } }
  );
  if (stuckJobs.modifiedCount > 0) {
    console.log(`📧🔧 Recovered ${stuckJobs.modifiedCount} stuck email job(s) from previous crash.`);
  }

  console.log('📧✅ Email worker started — processing queue at ~3.3 emails/sec.');
  poll();
};

/**
 * Gracefully stop the email worker.
 */
const stopEmailWorker = () => {
  isRunning = false;
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
  console.log('📧⏹️ Email worker stopped.');
};

/** Promise-based sleep utility */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
  startEmailWorker,
  stopEmailWorker
};
