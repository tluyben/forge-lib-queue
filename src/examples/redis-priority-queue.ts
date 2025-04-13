import { createScheduler, SchedulerType } from '../lib/scheduler';

/**
 * Example demonstrating Redis-based queue with job priorities
 * Note: This example requires a running Redis instance
 */
async function main() {
  // Create a Bull scheduler with Redis connection
  const scheduler = createScheduler(SchedulerType.BULL, 'priority-queue', {
    redis: {
      host: 'localhost',
      port: 6379
    }
  });

  // Define a job handler that simulates work
  const handler = async (data: any) => {
    console.log(`Processing job with priority ${data.priority}:`, data);
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { 
      processed: true, 
      priority: data.priority,
      timestamp: new Date().toISOString() 
    };
  };

  // Schedule multiple jobs with different priorities
  const jobs = [
    { data: { message: 'Low priority job', priority: 3 }, priority: 3 },
    { data: { message: 'High priority job', priority: 1 }, priority: 1 },
    { data: { message: 'Medium priority job', priority: 2 }, priority: 2 }
  ];

  // Schedule all jobs
  jobs.forEach(job => {
    scheduler.schedule(handler, job.data, { priority: job.priority });
  });

  // Add completion callback
  scheduler.onCompleted(async (data, result) => {
    console.log('Job completed:', { data, result });
  });

  // Add failure callback
  scheduler.onFailed(async (data, error) => {
    console.error('Job failed:', { data, error });
  });

  // Keep the process running for a while to see the results
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Clean up
  scheduler.stop();
}

// Run the example
main().catch(console.error); 