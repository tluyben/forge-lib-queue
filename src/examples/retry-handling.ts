import { createScheduler, SchedulerType } from '../lib/scheduler';

/**
 * Example demonstrating job retry functionality
 */
async function main() {
  // Create a Toad scheduler
  const scheduler = createScheduler(SchedulerType.TOAD, 'retry-queue');

  let attemptCount = 0;

  // Define a job handler that fails twice before succeeding
  const handler = async (data: any) => {
    attemptCount++;
    console.log(`Attempt ${attemptCount} for job:`, data);

    if (attemptCount < 3) {
      throw new Error(`Simulated failure on attempt ${attemptCount}`);
    }

    return { 
      success: true, 
      attempts: attemptCount,
      timestamp: new Date().toISOString() 
    };
  };

  // Schedule a job with 3 retry attempts
  scheduler.schedule(handler, { message: 'Retry test' }, {
    retry: 3
  });

  // Add completion callback
  scheduler.onCompleted(async (data, result) => {
    console.log('Job eventually succeeded:', { data, result });
  });

  // Add failure callback
  scheduler.onFailed(async (data, error) => {
    console.error('Job failed after all retries:', { data, error });
  });

  // Keep the process running for a while to see the results
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // Clean up
  scheduler.stop();
}

// Run the example
main().catch(console.error); 