import { ToadScheduler as ToadLib, AsyncTask, CronJob, SimpleIntervalJob } from 'toad-scheduler';
import { v4 as uuidv4 } from 'uuid';
import { Scheduler } from './index';
import { SchedulerOptions, JobOptions } from './types';

export class ToadScheduler extends Scheduler {
  private scheduler: ToadLib;
  private jobs: Map<string, { job: SimpleIntervalJob | CronJob, data: any }>;
  
  constructor(name: string, options: SchedulerOptions = {}) {
    super(name, options);
    this.scheduler = new ToadLib();
    this.jobs = new Map();
  }
  
  /**
   * Start processing jobs
   */
  start(): this {
    // Toad scheduler starts automatically when jobs are added
    return this;
  }
  
  /**
   * Stop processing jobs
   */
  stop(): this {
    this.scheduler.stop();
    return this;
  }
  
  /**
   * Add a job to the scheduler
   */
  async job(data: any, options: JobOptions = {}): Promise<any> {
    if (!this.jobHandler) {
      throw new Error('No job handler defined. Use .handle() to define a handler.');
    }
    
    const jobId = options.jobId || uuidv4();
    
    // Create the task with built-in retry logic
    const task = new AsyncTask(
      `${this.name}-task-${jobId}`,
      async ({ retryCount = 0, jobData = data }) => {
        try {
          // Execute the handler
          const result = await this.jobHandler!(jobData);
          
          // Call completed callback if defined
          if (this.completedCallback) {
            await this.completedCallback(jobData, result);
          }
          
          return result;
        } catch (error) {
          // Implement retry logic
          const maxRetries = options.retry || 0;
          
          if (retryCount < maxRetries) {
            const nextRetryCount = retryCount + 1;
            const retryDelay = 1000 * Math.pow(2, retryCount); // Exponential backoff
            
            console.log(`Job ${jobId} failed, scheduling retry ${nextRetryCount} in ${retryDelay}ms`);
            
            // Schedule the retry
            setTimeout(() => {
              task.execute({ retryCount: nextRetryCount, jobData });
            }, retryDelay);
          } else {
            // Call failed callback if defined
            if (this.failedCallback) {
              await this.failedCallback(jobData, error);
            }
          }
          
          throw error;
        }
      },
      (err) => {
        // This is toad's built-in error handler
        console.error(`Job ${jobId} error:`, err);
      }
    );
    
    let toadJob;
    
    // Handle cron jobs
    if (options.cron) {
      toadJob = new CronJob(
        { cronExpression: options.cron },
        task
      );
      this.scheduler.addCronJob(toadJob);
    } 
    // Handle regular or delayed jobs
    else {
      let interval = 0;
      let runImmediately = true;
      
      if (options.delay) {
        interval = options.delay;
        runImmediately = false;
      }
      
      toadJob = new SimpleIntervalJob(
        { milliseconds: interval || 0, runImmediately },
        task,
        { id: jobId }
      );
      this.scheduler.addSimpleIntervalJob(toadJob);
      
      // For one-off jobs with no cron, remove the job after execution
      if (!options.cron && !options.delay) {
        task.execute({ jobData: data }).then(() => {
          this.scheduler.removeById(jobId);
        }).catch(() => {
          // Error handling handled in the task itself
        });
      }
    }
    
    // Store job reference
    this.jobs.set(jobId, { job: toadJob, data });
    
    return { id: jobId, data };
  }
}