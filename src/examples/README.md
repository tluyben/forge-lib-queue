# Queue Library Examples

This directory contains example usage of the Forge Queue Library. Each example demonstrates different features and use cases.

## Examples

### 1. Basic Usage (`basic-usage.ts`)

Demonstrates simple job scheduling with delayed execution. Shows how to:

- Create a scheduler
- Define a job handler
- Schedule a job with delay
- Handle job completion and failures

### 2. Cron Jobs (`cron-jobs.ts`)

Shows how to schedule recurring jobs using cron expressions. Demonstrates:

- Scheduling multiple cron jobs
- Different cron patterns
- Long-running scheduler process

### 3. Retry Handling (`retry-handling.ts`)

Illustrates the job retry mechanism with exponential backoff. Shows:

- Job retry configuration
- Handling failed attempts
- Exponential backoff between retries

### 4. Redis Priority Queue (`redis-priority-queue.ts`)

Demonstrates Redis-based queue with job priorities. Shows:

- Redis connection configuration
- Job prioritization
- Multiple job scheduling with different priorities

## Running the Examples

To run any example, use the following command:

```bash
# For basic usage
npx ts-node src/examples/basic-usage.ts

# For cron jobs
npx ts-node src/examples/cron-jobs.ts

# For retry handling
npx ts-node src/examples/retry-handling.ts

# For Redis priority queue (requires Redis)
npx ts-node src/examples/redis-priority-queue.ts
```

Note: The Redis example requires a running Redis instance on localhost:6379. Make sure Redis is running before executing that example.
