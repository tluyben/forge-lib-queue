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
  private jobs: Map<string, { job: CronJob | SimpleIntervalJob; isOneTime: boolean }>;

  constructor(options?: SchedulerOptions) {
    this.scheduler = new ToadLib();
    this.tasks = new Map();
    this.jobs = new Map();
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
          // For non-cron jobs, clean up after successful execution
          const jobInfo = this.jobs.get(taskId);
          if (jobInfo?.isOneTime) {
            this.scheduler.removeById(taskId);
            this.jobs.delete(taskId);
            this.tasks.delete(taskId);
          }
        } catch (error) {
          const taskInfo = this.tasks.get(taskId);
          if (!taskInfo) return;

          if (taskInfo.retries < maxRetries) {
            // Increment retry count
            taskInfo.retries += 1;
            // Schedule a retry with exponential backoff
            const retryDelay = 1000 * Math.pow(2, taskInfo.retries);
            setTimeout(() => {
              // Only execute if the task still exists
              if (this.tasks.has(taskId)) {
                task.execute();
              }
            }, retryDelay);
          } else {
            if (this.onError) {
              await this.onError(data, error);
            }
            // Clean up the failed job
            this.scheduler.removeById(taskId);
            this.jobs.delete(taskId);
            this.tasks.delete(taskId);
          }
        }
      }
    );

    this.tasks.set(taskId, { task, retries: 0 });
    return task;
  }

  schedule(handler: JobHandler, data: any, options: JobOptions = {}): this {
    const taskId = options.jobId || uuidv4();

    if (options.cron) {
      // For cron jobs, we create a new task for each execution
      const task = new AsyncTask(
        taskId,
        async () => {
          try {
            const result = await handler(data);
            if (this.onComplete) {
              await this.onComplete(data, result);
            }
          } catch (error) {
            if (this.onError) {
              await this.onError(data, error);
            }
          }
        }
      );

      const job = new CronJob({ cronExpression: options.cron }, task);
      this.jobs.set(taskId, { job, isOneTime: false });
      this.scheduler.addCronJob(job);
    } else if (options.delay) {
      // For delayed jobs, we use a one-time interval
      const task = this.createTask(handler, data, options);
      const job = new SimpleIntervalJob({ milliseconds: options.delay }, task);
      this.jobs.set(taskId, { job, isOneTime: true });
      this.scheduler.addSimpleIntervalJob(job);
    } else {
      // For immediate jobs
      const task = this.createTask(handler, data, options);
      const job = new SimpleIntervalJob({ milliseconds: 0 }, task);
      this.jobs.set(taskId, { job, isOneTime: true });
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
    this.jobs.clear();
    return this;
  }
}