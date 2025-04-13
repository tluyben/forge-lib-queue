import Queue from 'bull';
import { JobCallback, JobHandler, JobOptions, JobResult, SchedulerOptions } from './types';

export class BullScheduler {
  private queue: Queue.Queue;
  private onComplete?: JobCallback;
  private onError?: JobCallback;

  constructor(queueName: string, options?: SchedulerOptions) {
    this.queue = new Queue(queueName, {
      redis: options?.redis
    });

    // Set up event handlers
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Handle job completion
    this.queue.on('completed', async (job: Queue.Job, result: any) => {
      if (this.onComplete) {
        await this.onComplete(job.data, result);
      }
    });

    // Handle job failures
    this.queue.on('failed', async (job: Queue.Job, error: Error) => {
      if (this.onError) {
        await this.onError(job.data, error);
      }
    });
  }

  schedule(handler: JobHandler, data: any, options?: JobOptions): this {
    const jobOptions: Queue.JobOptions = {
      attempts: options?.retry || 1,
      delay: options?.delay || 0,
      jobId: options?.jobId,
      priority: options?.priority
    };

    if (options?.cron) {
      this.queue.add(data, { ...jobOptions, repeat: { cron: options.cron } });
    } else {
      this.queue.add(data, jobOptions);
    }

    // Set up the processor
    this.queue.process(async (job: Queue.Job) => {
      return handler(job.data);
    });

    return this;
  }

  onCompleted(callback: JobCallback): this {
    this.onComplete = callback;
    return this;
  }

  onFailed(callback: JobCallback): this {
    this.onError = callback;
    return this;
  }

  stop(): this {
    this.queue.close();
    return this;
  }
}