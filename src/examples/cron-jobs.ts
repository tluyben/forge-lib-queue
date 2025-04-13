import { createScheduler, SchedulerType } from '../lib/scheduler';

/**
 * Example demonstrating cron-based job scheduling
 */
async function main() {
  // Create a Toad scheduler
  const scheduler = createScheduler(SchedulerType.TOAD, 'cron-queue');

  // Define a job handler that logs the current time
  const handler = async (data: any) => {
    const now = new Date();
    console.log(`[${now.toISOString()}] Running scheduled job:`, data);
    return { executedAt: now.toISOString() };
  };

  // Schedule a job to run every minute
  scheduler.schedule(handler, { type: 'minute-job' }, {
    cron: '* * * * *' // Run every minute
  });

  // Schedule another job to run every 5 minutes
  scheduler.schedule(handler, { type: 'five-minute-job' }, {
    cron: '*/5 * * * *' // Run every 5 minutes
  });

  // Add completion callback
  scheduler.onCompleted(async (data, result) => {
    console.log('Cron job completed:', { data, result });
  });

  // Add failure callback
  scheduler.onFailed(async (data, error) => {
    console.error('Cron job failed:', { data, error });
  });

  console.log('Cron jobs scheduled. Press Ctrl+C to stop.');
  
  // Keep the process running
  await new Promise(() => {}); // This promise never resolves
}

// Run the example
main().catch(console.error); 