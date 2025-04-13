
/**
 * Options for configuring the scheduler
 */
export interface SchedulerOptions {
  // Bull-specific options
  redis?: {
    host?: string;
    port?: number;
    password?: string;
  };
  
  // Common options
  defaultJobOptions?: JobOptions;
}

/**
 * Options for configuring individual jobs
 */
export interface JobOptions {
  // Retry options
  retry?: number;
  
  // Scheduling options
  cron?: string;
  delay?: number; // delay in milliseconds
  
  // Priority (for Bull)
  priority?: number;
  
  // Job ID (optional, will auto-generate if not provided)
  jobId?: string;
}

/**
 * Handler function for processing jobs
 */
export type JobHandler = (data: any) => Promise<any>;

/**
 * Callback function for job completion or failure
 */
export type JobCallback = (data: any, result?: any) => Promise<void>;

/**
 * Job result interface
 */
export interface JobResult {
  id: string;
  data: any;
  result?: any;
  error?: Error;
}