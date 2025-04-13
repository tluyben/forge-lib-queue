# Forge Queue Library

A queue library for Forge that supports both in-memory (Toad) and Redis-based (Bull) job scheduling.

## Features

- In-memory job scheduling with Toad Scheduler
- Redis-based job scheduling with Bull
- Support for cron jobs
- Support for delayed jobs
- Automatic retries with exponential backoff
- Job completion and failure callbacks

## Installation

```bash
npm install forge-lib-queue
```

## Usage

### Basic Usage

```typescript
import { ToadScheduler } from "forge-lib-queue";

// Create a scheduler
const scheduler = new ToadScheduler();

// Schedule a job
scheduler.schedule(
  async (data) => {
    console.log("Processing job with data:", data);
    return "Job completed";
  },
  { foo: "bar" }
);

// Handle job completion
scheduler.onCompleted(async (data, result) => {
  console.log("Job completed with result:", result);
});

// Handle job failures
scheduler.onFailed(async (data, error) => {
  console.error("Job failed with error:", error);
});
```

### Using Bull with Redis

```typescript
import { BullScheduler } from "forge-lib-queue";

// Create a Bull scheduler with Redis connection
const scheduler = new BullScheduler("my-queue", {
  redis: {
    host: "localhost",
    port: 6379,
    password: "optional-password",
  },
});

// Schedule a job with retry
scheduler.schedule(
  async (data) => {
    console.log("Processing job with data:", data);
    return "Job completed";
  },
  { foo: "bar" },
  { retry: 3 }
);

// Schedule a cron job
scheduler.schedule(
  async (data) => {
    console.log("Running cron job");
  },
  { type: "cron" },
  { cron: "*/5 * * * *" } // Run every 5 minutes
);

// Schedule a delayed job
scheduler.schedule(
  async (data) => {
    console.log("Running delayed job");
  },
  { type: "delayed" },
  { delay: 60000 } // Run after 1 minute
);
```

## Testing

The library includes comprehensive tests for both the Toad and Bull implementations.

### Running Tests

By default, only the Toad tests will run (no Redis dependency):

```bash
npm test
```

To run the Bull tests (requires Redis):

```bash
npm run test:bull
```

To run all tests:

```bash
npm run test:all
```

### Redis Configuration for Tests

To run the Bull tests, you need to have Redis available. You can configure the Redis connection using environment variables:

```bash
REDIS_HOST=localhost REDIS_PORT=6379 REDIS_PASSWORD=your-password npm run test:bull
```

If these environment variables are not set, the Bull tests will be skipped automatically.

## License

ISC
