// @ts-ignore
import { ToadScheduler } from '../../lib/scheduler/toad-scheduler';
import { JobResult } from '../../lib/scheduler/types';
import {
  createSuccessHandler,
  createFailureHandler,
  createRetryHandler,
  createCronHandler,
  createDelayedStartHandler,
  waitForJobResult,
  sleep
} from '../helpers';

describe('ToadScheduler', () => {
  let scheduler: ToadScheduler;
  
  beforeEach(() => {
    // Create a new scheduler instance for each test
    scheduler = new ToadScheduler();
  });

  afterEach(() => {
    scheduler.stop();
  });

  it('should execute a job successfully', async () => {
    // Create a promise that will resolve when the job completes
    const jobCompleted = new Promise<JobResult>(resolve => {
      scheduler.onCompleted(async (data, result) => {
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
      scheduler.onFailed(async (data, error) => {
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
      scheduler.onCompleted(async (data, result) => {
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
      scheduler.onCompleted(async (data, result) => {
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
      scheduler.onCompleted(async (data, result) => {
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
}); 