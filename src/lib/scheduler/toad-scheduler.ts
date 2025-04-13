import { ToadScheduler as ToadLib, AsyncTask, CronJob, SimpleIntervalJob } from 'toad-scheduler';
import { v4 as uuidv4 } from 'uuid';
import { JobCallback, JobHandler, JobOptions, JobResult, SchedulerOptions } from './types';

interface TaskContext {
  handler: JobHandler;
  data: any;
  retries: number;
  maxRetries: number;
}

export class ToadScheduler {
  private scheduler: ToadLib;
  private onComplete?: JobCallback;
  private onError?: JobCallback;
  private tasks: Map<string, { task: AsyncTask; retries: number }>;

  constructor(options?: SchedulerOptions) {
    this.scheduler = new ToadLib();
    this.tasks = new Map();
  }

  private createTask(handler: JobHandler, data: any, options: JobOptions = {}): AsyncTask {
    const taskId = options.jobId || uuidv4();
    const maxRetries = options.retry || 0;

    const task = new AsyncTask(
      taskId,
      async () => {
        try {
          const result = await handler(data);
          if (this.onComplete) {
            await this.onComplete(data, result);
          }
        } catch (error) {
          const taskInfo = this.tasks.get(taskId);
          if (!taskInfo) return;

          if (taskInfo.retries < maxRetries) {
            // Increment retry count
            taskInfo.retries += 1;
            // Schedule a retry with exponential backoff
            setTimeout(() => {
              task.execute();
            }, 1000 * Math.pow(2, taskInfo.retries));
          } else if (this.onError) {
            // Max retries reached, call error handler
            await this.onError(data, error);
          }
        }
      },
      (err: Error) => {
        if (this.onError) {
          this.onError(data, err);
        }
      }
    );

    this.tasks.set(taskId, { task, retries: 0 });
    return task;
  }

  schedule(handler: JobHandler, data: any, options: JobOptions = {}): this {
    const task = this.createTask(handler, data, options);

    if (options.cron) {
      const job = new CronJob({ cronExpression: options.cron }, task);
      this.scheduler.addCronJob(job);
    } else if (options.delay) {
      const job = new SimpleIntervalJob({ milliseconds: options.delay }, task);
      this.scheduler.addSimpleIntervalJob(job);
    } else {
      const job = new SimpleIntervalJob({ milliseconds: 0 }, task);
      this.scheduler.addSimpleIntervalJob(job);
    }

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
    this.scheduler.stop();
    this.tasks.clear();
    return this;
  }
}