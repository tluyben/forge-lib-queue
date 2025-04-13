import Queue from 'bull';
import { Scheduler } from './index';
import { SchedulerOptions, JobOptions } from './types';

export class BullScheduler extends Scheduler {
  private queue: Queue.Queue;
  private isProcessing: boolean = false;
  
  constructor(name: string, options: SchedulerOptions = {}) {
    super(name, options);
    
    // Create Bull queue
    this.queue = new Queue(name, {
      redis: options.redis || {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD
      }
    });
    
    // Set up event handlers
    this.queue.on('completed', async (job, result) => {
      if (this.completedCallback) {
        await this.completedCallback(job.data, result);
      }
    });
    
    this.queue.on('failed', async (job, error) => {
      if (this.failedCallback) {
        await this.failedCallback(job.data, error);
      }
    });
  }
  
  /**
   * Start processing jobs
   */
  start(): this {
    if (!this.jobHandler) {
      throw new Error('No job handler defined. Use .handle() to define a handler.');
    }
    
    if (!this.isProcessing) {
      this.queue.process(async (job) => {
        return await this.jobHandler!(job.data);
      });
      this.isProcessing = true;
    }
    
    return this;
  }
  
  /**
   * Stop processing jobs
   */
  async stop(): Promise<this> {
    await this.queue.close();
    this.isProcessing = false;
    return this;
  }
  
  /**
   * Add a job to the queue
   */
  async job(data: any, options: JobOptions = {}): Promise<any> {
    const bullOptions: Queue.JobOptions = {
      attempts: (options.retry || 0) + 1,
      jobId: options.jobId,
      priority: options.priority
    };
    
    // Handle delay
    if (options.delay) {
      bullOptions.delay = options.delay;
    }
    
    // Handle cron repeat
    if (options.cron) {
      bullOptions.repeat = {
        cron: options.cron
      };
    }
    
    return await this.queue.add(data, bullOptions);
  }
}