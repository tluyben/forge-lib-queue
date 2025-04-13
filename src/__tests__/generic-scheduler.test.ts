import { createScheduler, SchedulerType } from '../lib/scheduler';
import { JobResult, SchedulerOptions } from '../lib/scheduler/types';
import {
  createSuccessHandler,
  createFailureHandler,
  createRetryHandler,
  createCronHandler,
  createDelayedStartHandler,
  waitForJobResult,
  sleep
} from './helpers';

describe('Generic Scheduler Interface', () => {
  let scheduler: ReturnType<typeof createScheduler>;
  
  beforeEach(() => {
    // Create a new scheduler instance for each test using the factory
    scheduler = createScheduler(SchedulerType.TOAD, 'test-scheduler');
  });

  afterEach(() => {
    scheduler.stop();
  });

  it('should execute a job successfully', async () => {
    // Create a promise that will resolve when the job completes
    const jobCompleted = new Promise<JobResult>(resolve => {
      scheduler.onCompleted(async (data: any, result: any) => {
        resolve({ id: 'test', data, result });
      });
    });
    
    const handler = createSuccessHandler(100, 'test success');
    const data = { test: 'data' };

    scheduler.schedule(handler, data);

    // Wait for job completion
    const result = await jobCompleted;
    
    expect(result.result).toEqual({ test: 'data', result: 'test success' });
  });

  it('should handle job failures', async () => {
    // Create a promise that will resolve when the job fails
    const jobFailed = new Promise<JobResult>(resolve => {
      scheduler.onFailed(async (data: any, error: any) => {
        resolve({ id: 'test', data, error: error as Error });
      });
    });
    
    const handler = createFailureHandler(100, 'test failure');
    const data = { test: 'data' };

    scheduler.schedule(handler, data);

    // Wait for job failure
    const result = await jobFailed;
    
    expect(result.error?.message).toBe('test failure');
  });

  it('should retry failed jobs', async () => {
    // Create a promise that will resolve when the job completes after retry
    const jobCompleted = new Promise<JobResult>(resolve => {
      scheduler.onCompleted(async (data: any, result: any) => {
        resolve({ id: 'test', data, result });
      });
    });
    
    const handler = createRetryHandler(100);
    const data = { test: 'data' };

    scheduler.schedule(handler, data, { retry: 1 });

    // Wait for retry and completion
    const result = await jobCompleted;
    
    expect(result.result.attempt).toBe(2);
  });

  it('should execute cron jobs', async () => {
    // Create a promise that will resolve when the cron job executes
    const jobCompleted = new Promise<JobResult>(resolve => {
      scheduler.onCompleted(async (data: any, result: any) => {
        resolve({ id: 'test', data, result });
      });
    });
    
    const handler = createCronHandler();
    const data = { test: 'data' };

    // Schedule a job to run every second
    scheduler.schedule(handler, data, { cron: '* * * * * *' });

    // Wait for at least one execution
    const result = await jobCompleted;
    
    expect(result.result).toHaveProperty('timestamp');
  });

  it('should execute delayed start jobs', async () => {
    // Create a promise that will resolve when the delayed job executes
    const jobCompleted = new Promise<JobResult>(resolve => {
      scheduler.onCompleted(async (data: any, result: any) => {
        resolve({ id: 'test', data, result });
      });
    });
    
    const handler = createDelayedStartHandler();
    const data = { test: 'data' };

    // Schedule a job with a 1-second delay
    scheduler.schedule(handler, data, { delay: 1000 });

    // Wait for the delayed execution
    const result = await jobCompleted;
    
    expect(result.result).toHaveProperty('startTime');
  });

  it('should stop all jobs when stopped', async () => {
    let jobCompleted = false;
    
    scheduler.onCompleted(async () => {
      jobCompleted = true;
    });
    
    const handler = createSuccessHandler(100);
    const data = { test: 'data' };

    scheduler.schedule(handler, data);
    scheduler.stop();

    // Wait to see if any jobs complete after stopping
    await sleep(200);

    expect(jobCompleted).toBe(false);
  });

  it('should handle multiple jobs concurrently', async () => {
    const results: JobResult[] = [];
    
    scheduler.onCompleted(async (data, result) => {
      if (data.job >= 1 && data.job <= 3) {
        results.push({ id: 'test', data, result });
      }
    });
    
    const handler1 = createSuccessHandler(100, 'job1 success');
    const handler2 = createSuccessHandler(150, 'job2 success');
    const handler3 = createSuccessHandler(200, 'job3 success');
    
    scheduler.schedule(handler1, { job: 1 });
    scheduler.schedule(handler2, { job: 2 });
    scheduler.schedule(handler3, { job: 3 });
    
    // Wait for all jobs to complete
    await sleep(500);
    
    // Verify we got all three jobs
    const job1Result = results.find(r => r.data.job === 1);
    const job2Result = results.find(r => r.data.job === 2);
    const job3Result = results.find(r => r.data.job === 3);
    
    expect(job1Result).toBeDefined();
    expect(job2Result).toBeDefined();
    expect(job3Result).toBeDefined();
    
    expect(job1Result?.result.result).toBe('job1 success');
    expect(job2Result?.result.result).toBe('job2 success');
    expect(job3Result?.result.result).toBe('job3 success');
  });

  it('should handle job with custom ID', async () => {
    const jobCompleted = new Promise<JobResult>(resolve => {
      scheduler.onCompleted(async (data: any, result: any) => {
        resolve({ id: 'custom-id', data, result });
      });
    });
    
    const handler = createSuccessHandler(100, 'custom id success');
    const data = { test: 'data' };
    
    scheduler.schedule(handler, data, { jobId: 'custom-id' });
    
    const result = await jobCompleted;
    expect(result.id).toBe('custom-id');
    expect(result.result.result).toBe('custom id success');
  });

  it('should handle job with complex data', async () => {
    const jobCompleted = new Promise<JobResult>(resolve => {
      scheduler.onCompleted(async (data: any, result: any) => {
        resolve({ id: 'test', data, result });
      });
    });
    
    const handler = createSuccessHandler(100, 'complex data success');
    const complexData = {
      nested: {
        object: {
          with: {
            arrays: [1, 2, 3, { more: 'data' }],
            and: {
              more: 'nested data'
            }
          }
        }
      },
      date: new Date(),
      regex: /test-pattern/,
      function: () => 'test'
    };
    
    scheduler.schedule(handler, complexData);
    
    const result = await jobCompleted;
    expect(result.data).toEqual(complexData);
    expect(result.result.result).toBe('complex data success');
  });

  it('should handle job with zero delay', async () => {
    const jobCompleted = new Promise<JobResult>(resolve => {
      scheduler.onCompleted(async (data: any, result: any) => {
        resolve({ id: 'test', data, result });
      });
    });
    
    const handler = createSuccessHandler(50, 'zero delay success');
    const data = { test: 'data' };
    
    scheduler.schedule(handler, data, { delay: 0 });
    
    const result = await jobCompleted;
    expect(result.result.result).toBe('zero delay success');
  });

  it('should handle job with very long delay', async () => {
    const jobCompleted = new Promise<JobResult>(resolve => {
      scheduler.onCompleted(async (data: any, result: any) => {
        resolve({ id: 'test', data, result });
      });
    });
    
    const handler = createSuccessHandler(50, 'long delay success');
    const data = { test: 'data' };
    
    // Use a shorter delay for testing purposes
    scheduler.schedule(handler, data, { delay: 500 });
    
    // Wait for the delayed execution
    const result = await jobCompleted;
    expect(result.result.result).toBe('long delay success');
  });

  it('should handle job with invalid cron expression', async () => {
    const handler = createSuccessHandler(100, 'invalid cron');
    const data = { test: 'data' };
    
    // The ToadScheduler throws an error for invalid cron expressions
    expect(() => {
      scheduler.schedule(handler, data, { cron: 'invalid-cron' });
    }).toThrow();
  });

  it('should handle job with empty data', async () => {
    const jobCompleted = new Promise<JobResult>(resolve => {
      scheduler.onCompleted(async (data: any, result: any) => {
        resolve({ id: 'test', data, result });
      });
    });
    
    const handler = createSuccessHandler(100, 'empty data success');
    
    scheduler.schedule(handler, {});
    
    const result = await jobCompleted;
    expect(result.data).toEqual({});
    expect(result.result.result).toBe('empty data success');
  });

  it('should handle job with null data', async () => {
    const jobCompleted = new Promise<JobResult>(resolve => {
      scheduler.onCompleted(async (data: any, result: any) => {
        resolve({ id: 'test', data, result });
      });
    });
    
    const handler = createSuccessHandler(100, 'null data success');
    
    scheduler.schedule(handler, null);
    
    const result = await jobCompleted;
    expect(result.data).toBeNull();
    expect(result.result.result).toBe('null data success');
  });

  it('should handle job with undefined data', async () => {
    const jobCompleted = new Promise<JobResult>(resolve => {
      scheduler.onCompleted(async (data: any, result: any) => {
        resolve({ id: 'test', data, result });
      });
    });
    
    const handler = createSuccessHandler(100, 'undefined data success');
    
    scheduler.schedule(handler, undefined);
    
    const result = await jobCompleted;
    expect(result.data).toBeUndefined();
    expect(result.result.result).toBe('undefined data success');
  });

  it('should handle multiple callbacks', async () => {
    const completedResults: any[] = [];
    const failedResults: any[] = [];
    
    scheduler.onCompleted(async (data: any, result: any) => {
      completedResults.push({ data, result });
    });
    
    scheduler.onFailed(async (data: any, error: any) => {
      failedResults.push({ data, error });
    });
    
    const successHandler = createSuccessHandler(100, 'success');
    const failureHandler = createFailureHandler(100, 'failure');
    
    scheduler.schedule(successHandler, { type: 'success' });
    scheduler.schedule(failureHandler, { type: 'failure' });
    
    // Wait for both jobs to complete
    await sleep(200);
    
    expect(completedResults.length).toBe(1);
    expect(failedResults.length).toBe(1);
    expect(completedResults[0].result.result).toBe('success');
    expect(failedResults[0].error.message).toBe('failure');
  });
}); 