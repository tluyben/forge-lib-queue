import { JobResult } from '../lib/scheduler/types';

/**
 * Creates a promise that resolves after the specified time
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Creates a mock job handler that succeeds after a delay
 */
export const createSuccessHandler = (delay = 100, result = 'success') => {
  return async (data: any): Promise<any> => {
    await sleep(delay);
    return { ...data, result };
  };
};

/**
 * Creates a mock job handler that fails after a delay
 */
export const createFailureHandler = (delay = 100, errorMessage = 'Job failed') => {
  return async (data: any): Promise<any> => {
    await sleep(delay);
    console.log('Job failed');
    throw new Error(errorMessage);
  };
};

/**
 * Creates a mock job handler that fails on the first attempt and succeeds on retry
 */
export const createRetryHandler = (delay = 100, result = 'success after retry') => {
  let attempts = new Map<string, number>();
  return async (data: any): Promise<any> => {
    await sleep(delay);
    const key = JSON.stringify(data);
    const attempt = (attempts.get(key) || 0) + 1;
    attempts.set(key, attempt);
    
    if (attempt === 1) {
      console.log('First attempt failed');
      throw new Error('First attempt failed');
    }
    return { ...data, result, attempt };
  };
};

/**
 * Creates a mock job handler that simulates a cron job
 */
export const createCronHandler = (result = 'cron job executed') => {
  return async (data: any): Promise<any> => {
    return { 
      ...data, 
      result,
      timestamp: new Date().toISOString() 
    };
  };
};

/**
 * Creates a mock job handler that simulates a delayed start job
 */
export const createDelayedStartHandler = (result = 'delayed job executed') => {
  return async (data: any): Promise<any> => {
    return { 
      ...data, 
      result,
      startTime: new Date().toISOString() 
    };
  };
};

/**
 * Creates a promise that resolves when a job completes or fails
 */
export const waitForJobResult = (
  onComplete: (callback: (result: JobResult) => void) => void,
  onError: (callback: (result: JobResult) => void) => void,
  timeout = 5000
): Promise<JobResult> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Job result timeout'));
    }, timeout);

    const completeHandler = (result: JobResult) => {
      clearTimeout(timeoutId);
      resolve(result);
    };

    const errorHandler = (result: JobResult) => {
      clearTimeout(timeoutId);
      resolve(result);
    };

    // Register the handlers
    onComplete(completeHandler);
    onError(errorHandler);
  });
}; 