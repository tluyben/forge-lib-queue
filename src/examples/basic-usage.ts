import { createScheduler, SchedulerType } from '../lib/scheduler';

/**
 * Basic usage example demonstrating simple job scheduling
 */
async function main() {
  // Create a Toad scheduler (in-memory)
  const scheduler = createScheduler(SchedulerType.TOAD, 'basic-queue');

  // Define a simple job handler
  const handler = async (data: any) => {
    console.log(`Processing job with data:`, data);
    return { processed: true, timestamp: new Date().toISOString() };
  };

  // Schedule a job with a 2-second delay
  scheduler.schedule(handler, { message: 'Hello, World!' }, {
    delay: 2000
  });

  // Add completion callback
  scheduler.onCompleted(async (data, result) => {
    console.log('Job completed successfully:', { data, result });
  });

  // Add failure callback
  scheduler.onFailed(async (data, error) => {
    console.error('Job failed:', { data, error });
  });

  // Keep the process running for a while to see the results
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Clean up
  scheduler.stop();
}

// Run the example
main().catch(console.error); 