/**
 * Next.js Instrumentation
 *
 * This file is used to initialize Sentry, cron jobs, and other monitoring tools
 * It runs once when the server starts
 */

export async function register() {
  // Initialize Sentry based on runtime
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')

    // Initialize cron jobs (only in Node.js runtime, not Edge)
    // Delay import to ensure Prisma is available
    const { initializeCronJobs } = await import('./src/lib/cron')
    initializeCronJobs()
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}
