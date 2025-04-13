# Forge Queue Library

A flexible job queue library that supports both Bull (Redis-based) and Toad (in-memory) schedulers.

## Features

- Support for both Bull (Redis-based) and Toad (in-memory) schedulers
- Consistent API across different scheduler implementations
- Job scheduling with cron expressions
- Delayed job execution
- Job retry with exponential backoff
- Success and failure callbacks
- TypeScript support

## Installation

```bash
npm install forge-lib-queue
```

## Usage

```typescript
import { createScheduler, SchedulerType } from "forge-lib-queue";

// Create a Bull scheduler (requires Redis)
const bullScheduler = createScheduler(SchedulerType.BULL, "my-queue", {
  redis: {
    host: "localhost",
    port: 6379,
  },
});

// Create a Toad scheduler (in-memory)
const toadScheduler = createScheduler(SchedulerType.TOAD, "my-queue");

// Define a job handler
const handler = async (data: any) => {
  console.log("Processing job:", data);
  // Your job logic here
};

// Schedule a job
scheduler.schedule(
  handler,
  { foo: "bar" },
  {
    cron: "*/5 * * * *", // Run every 5 minutes
    retry: 3, // Retry up to 3 times on failure
  }
);

// Add completion callback
scheduler.onCompleted(async (data, result) => {
  console.log("Job completed:", { data, result });
});

// Add failure callback
scheduler.onFailed(async (data, error) => {
  console.error("Job failed:", { data, error });
});
```

## Configuration

### Scheduler Options

- `redis`: Redis connection options (Bull only)
  - `host`: Redis host
  - `port`: Redis port
  - `password`: Redis password (optional)

### Job Options

- `cron`: Cron expression for recurring jobs
- `delay`: Delay in milliseconds before job execution
- `retry`: Number of retry attempts on failure
- `jobId`: Custom job ID (auto-generated if not provided)
- `priority`: Job priority (Bull only)

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Watch mode during development
npm run dev
```

## License

ISC
