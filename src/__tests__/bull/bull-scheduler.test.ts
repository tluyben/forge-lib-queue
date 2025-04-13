// @ts-ignore
import { BullScheduler } from '../../lib/scheduler/bull-scheduler';
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

// Skip tests if Redis is not available
const isRedisAvailable = process.env.REDIS_HOST && process.env.REDIS_PORT;
const testIfRedisAvailable = isRedisAvailable ? it : it.skip;

describe('BullScheduler', () => {
  let scheduler: BullScheduler;
  let completedJobs: JobResult[] = [];
  let failedJobs: JobResult[] = [];

  beforeEach(() => {
    const queueName = `test-queue-${Date.now()}`;
    scheduler = new BullScheduler(queueName, {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD
      }
    });
    
    completedJobs = [];
    failedJobs = [];

    scheduler
      .onCompleted(async (data, result) => {
        completedJobs.push({ id: 'test', data, result });
      })
      .onFailed(async (data, error) => {
        failedJobs.push({ id: 'test', data, error: error as Error });
      });
  });

  afterEach(async () => {
    await scheduler.stop();
  });

  testIfRedisAvailable('should execute a job successfully', async () => {
    const handler = createSuccessHandler(100, 'test success');
    const data = { test: 'data' };

    scheduler.schedule(handler, data);

    // Wait for job completion
    await sleep(200);

    expect(completedJobs.length).toBe(1);
    expect(completedJobs[0].result).toEqual({ test: 'data', result: 'test success' });
    expect(failedJobs.length).toBe(0);
  });

  testIfRedisAvailable('should handle job failures', async () => {
    const handler = createFailureHandler(100, 'test failure');
    const data = { test: 'data' };

    scheduler.schedule(handler, data);

    // Wait for job failure
    await sleep(200);

    expect(completedJobs.length).toBe(0);
    expect(failedJobs.length).toBe(1);
    expect(failedJobs[0].error.message).toBe('test failure');
  });

  testIfRedisAvailable('should retry failed jobs', async () => {
    const handler = createRetryHandler(100);
    const data = { test: 'data' };

    scheduler.schedule(handler, data, { retry: 1 });

    // Wait for retry and completion
    await sleep(500);

    expect(completedJobs.length).toBe(1);
    expect(completedJobs[0].result.attempt).toBe(2);
    expect(failedJobs.length).toBe(0);
  });

  testIfRedisAvailable('should execute cron jobs', async () => {
    const handler = createCronHandler();
    const data = { test: 'data' };

    // Schedule a job to run every second
    scheduler.schedule(handler, data, { cron: '* * * * * *' });

    // Wait for at least one execution
    await sleep(1100);

    expect(completedJobs.length).toBeGreaterThan(0);
    expect(completedJobs[0].result).toHaveProperty('timestamp');
    expect(failedJobs.length).toBe(0);
  });

  testIfRedisAvailable('should execute delayed start jobs', async () => {
    const handler = createDelayedStartHandler();
    const data = { test: 'data' };

    // Schedule a job with a 1-second delay
    scheduler.schedule(handler, data, { delay: 1000 });

    // Wait for the delayed execution
    await sleep(1100);

    expect(completedJobs.length).toBe(1);
    expect(completedJobs[0].result).toHaveProperty('startTime');
    expect(failedJobs.length).toBe(0);
  });

  testIfRedisAvailable('should stop all jobs when stopped', async () => {
    const handler = createSuccessHandler(100);
    const data = { test: 'data' };

    scheduler.schedule(handler, data);
    await scheduler.stop();

    // Wait to see if any jobs complete after stopping
    await sleep(200);

    expect(completedJobs.length).toBe(0);
    expect(failedJobs.length).toBe(0);
  });
}); 