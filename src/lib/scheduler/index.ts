import { BullScheduler } from './bull-scheduler';
import { ToadScheduler } from './toad-scheduler';
import { SchedulerOptions, JobOptions, JobHandler, JobCallback } from './types';

/**
 * Factory function to create the appropriate scheduler based on environment config
 */
export function createScheduler(name: string, options: SchedulerOptions = {}) {
  const schedulerType = process.env.SCHEDULER?.toLowerCase() || 'toad';
  
  if (schedulerType === 'bull') {
    return new BullScheduler(name, options);
  } else {
    return new ToadScheduler(name, options);
  }
}

/**
 * Abstract Scheduler class that both implementations will extend
 */
export abstract class Scheduler {
  protected name: string;
  protected options: SchedulerOptions;
  protected jobHandler?: JobHandler;
  protected completedCallback?: JobCallback;
  protected failedCallback?: JobCallback;
  
  constructor(name: string, options: SchedulerOptions = {}) {
    this.name = name;
    this.options = options;
  }
  
  /**
   * Set the main job handler function
   */
  handle(handler: JobHandler): this {
    this.jobHandler = handler;
    return this;
  }
  
  /**
   * Set callback for when a job completes successfully
   */
  completed(callback: JobCallback): this {
    this.completedCallback = callback;
    return this;
  }
  
  /**
   * Set callback for when a job fails
   */
  failed(callback: JobCallback): this {
    this.failedCallback = callback;
    return this;
  }
  
  /**
   * Add a job to the queue
   */
  abstract job(data: any, options?: JobOptions): Promise<any>;
  
  /**
   * Start the scheduler
   */
  abstract start(): this;
  
  /**
   * Stop the scheduler
   */
  abstract stop(): this;
}