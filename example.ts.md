import { createScheduler } from './lib/scheduler';

// Set environment variable to choose implementation
// process.env.SCHEDULER = 'bull'; // Or 'toad'

async function main() {
// Create a scheduler for email processing
const emailScheduler = createScheduler('email-sender', {
// Bull-specific options (ignored by Toad)
redis: {
host: 'localhost',
port: 6379
},
// Common options
defaultJobOptions: {
retry: 3
}
});

// Define the main job handler
emailScheduler
.handle(async (data) => {
console.log(`Processing email job: ${JSON.stringify(data)}`);

      // Simulate sending email
      if (Math.random() < 0.2) {
        throw new Error('Email sending failed');
      }

      console.log(`Email sent to ${data.to}`);
      return { sent: true, timestamp: new Date() };
    })
    .completed(async (data, result) => {
      console.log(`Email job completed: ${JSON.stringify(result)}`);
    })
    .failed(async (data, error) => {
      console.error(`Email job failed: ${error.message}`);
    });

// Start the scheduler
emailScheduler.start();

// Add a one-time job
await emailScheduler.job({
to: 'user@example.com',
subject: 'Hello',
body: 'This is a test email'
}, {
retry: 2
});

// Add a delayed job
await emailScheduler.job({
to: 'delayed@example.com',
subject: 'Delayed Email',
body: 'This email was scheduled for later'
}, {
delay: 10000, // 10 seconds
retry: 2
});

// Add a recurring job (runs every 5 minutes)
await emailScheduler.job({
to: 'newsletter@example.com',
subject: 'Daily Newsletter',
template: 'newsletter-template'
}, {
cron: '_/5 _ \* \* \*',
retry: 3
});

console.log('Jobs scheduled. Press Ctrl+C to exit.');
}

main().catch(console.error);

// Example of creating multiple schedulers for different types of tasks
async function createMultipleSchedulers() {
// Email scheduler
const emailScheduler = createScheduler('email-sender')
.handle(async (data) => { /_ handle emails _/ })
.start();

// Report generator scheduler
const reportScheduler = createScheduler('report-generator')
.handle(async (data) => { /_ generate reports _/ })
.start();

// Data import scheduler  
 const importScheduler = createScheduler('data-importer')
.handle(async (data) => { /_ import data _/ })
.start();
}
