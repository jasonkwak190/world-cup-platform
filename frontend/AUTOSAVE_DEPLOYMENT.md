# 🚀 Autosave Cleanup Deployment Guide

This guide explains how to deploy and configure the autosave cleanup system for production environments.

## 📋 Prerequisites

- Node.js 18+ installed
- Access to the server/container where the application runs
- Database access (PostgreSQL/Supabase)
- Cron service available (for scheduled cleanup)

## 🔧 Environment Setup

### 1. Environment Variables

Set the following environment variables:

```bash
# Required
CRON_SECRET="your-secure-cron-secret-key"
DATABASE_URL="your-database-connection-string"

# Optional
CLEANUP_CONFIG='{"expiredPlaySaves": 7, "oldDraftSaves": 30}'
```

### 2. Database Migrations

Ensure the autosave tables are created:

```sql
-- These should already exist from the autosave setup
-- worldcup_play_saves
-- worldcup_draft_saves
```

## 🚀 Deployment Options

### Option 1: Traditional Cron Job (Recommended)

#### Setup

1. **Install dependencies**:
   ```bash
   cd /path/to/your/project
   npm install
   ```

2. **Run the setup script**:
   ```bash
   export CRON_SECRET="your-secure-secret"
   ./cron/setup-cron.sh
   ```

3. **Verify installation**:
   ```bash
   crontab -l
   ```

#### Configuration

Edit `cron/cleanup-config.json`:

```json
{
  "expiredPlaySaves": 7,      // Days after which play saves expire
  "oldDraftSaves": 30,        // Days after which draft saves expire
  "cronSchedule": "0 2 * * *", // Daily at 2 AM
  "maxBatchSize": 100,        // Max items to process in one batch
  "processingDelayMs": 1000,  // Delay between batches
  "maxRetries": 3,            // Retry attempts on failure
  "retryDelayMs": 5000        // Delay between retries
}
```

### Option 2: Docker Container

#### Dockerfile Example

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Install cron
RUN apk add --no-cache dcron

# Copy cron setup
COPY cron/cleanup-config.json /app/cron/
COPY scripts/cleanup-cron.js /app/scripts/

# Setup cron job
RUN echo "0 2 * * * cd /app && node scripts/cleanup-cron.js --config /app/cron/cleanup-config.json" | crontab -

# Start cron daemon
CMD ["crond", "-f", "-d", "0"]
```

#### Docker Compose Example

```yaml
version: '3.8'
services:
  cleanup:
    build: .
    environment:
      - CRON_SECRET=${CRON_SECRET}
      - DATABASE_URL=${DATABASE_URL}
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
```

### Option 3: Cloud Functions (Serverless)

#### Vercel Cron

Create `api/cron/cleanup.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { AutosaveCleanupScheduler } from '../../src/lib/autosave-scheduler';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const scheduler = new AutosaveCleanupScheduler();
    const result = await scheduler.executeCleanup(false);
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Cleanup failed', details: error.message },
      { status: 500 }
    );
  }
}
```

#### Vercel Configuration

In `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### Option 4: GitHub Actions

Create `.github/workflows/cleanup.yml`:

```yaml
name: Autosave Cleanup

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm install
        
      - name: Run cleanup
        env:
          CRON_SECRET: ${{ secrets.CRON_SECRET }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: node scripts/cleanup-cron.js --config cron/cleanup-config.json
```

## 📊 Monitoring and Logging

### 1. Log Files

Logs are written to:
- `logs/cleanup-cron.log` - General cleanup logs
- `logs/cleanup-error.log` - Error logs only

### 2. Monitoring Setup

#### Health Check Endpoint

Add to your API routes:

```typescript
// api/health/cleanup.ts
export async function GET() {
  const { getCleanupStatus } = await import('../../src/lib/autosave-scheduler');
  const status = getCleanupStatus();
  
  return NextResponse.json({
    status: 'healthy',
    lastRun: status.lastRunTime,
    nextRun: status.nextRunTime,
    isRunning: status.isRunning,
    stats: status.stats
  });
}
```

#### Alerting

Set up alerts for:
- Cleanup job failures
- High error rates
- Unusual cleanup volumes
- Long processing times

### 3. Metrics Collection

Consider integrating with:
- **Sentry**: For error tracking
- **DataDog**: For metrics and monitoring
- **New Relic**: For APM
- **Prometheus**: For custom metrics

## 🔒 Security Considerations

### 1. Authentication

- Use a strong `CRON_SECRET` (minimum 32 characters)
- Rotate the secret regularly
- Don't log the secret in plaintext

### 2. Rate Limiting

- Implement rate limiting on cleanup endpoints
- Use batch processing to avoid overwhelming the database
- Add circuit breakers for external dependencies

### 3. Access Control

- Restrict cleanup endpoint access to authorized sources
- Use IP whitelisting for cron jobs
- Implement request signing for additional security

## 🚨 Troubleshooting

### Common Issues

1. **Cron job not running**:
   ```bash
   # Check cron service
   systemctl status cron
   
   # Check cron logs
   tail -f /var/log/cron
   
   # Verify cron job
   crontab -l
   ```

2. **Database connection issues**:
   ```bash
   # Test database connection
   node -e "console.log(process.env.DATABASE_URL)"
   
   # Check database logs
   tail -f /var/log/postgresql/postgresql.log
   ```

3. **Memory issues**:
   ```bash
   # Monitor memory usage
   top -p $(pgrep node)
   
   # Check for memory leaks
   node --inspect scripts/cleanup-cron.js --dry-run
   ```

### Performance Tuning

1. **Batch Size**: Adjust `maxBatchSize` based on database performance
2. **Processing Delay**: Increase `processingDelayMs` for slower databases
3. **Retry Logic**: Adjust `maxRetries` and `retryDelayMs` for network conditions

## 📈 Performance Optimization

### 1. Database Optimization

```sql
-- Add indexes for cleanup queries
CREATE INDEX IF NOT EXISTS idx_play_saves_cleanup 
ON worldcup_play_saves (user_id, updated_at);

CREATE INDEX IF NOT EXISTS idx_draft_saves_cleanup 
ON worldcup_draft_saves (user_id, updated_at);
```

### 2. Cleanup Optimization

- Run cleanup during off-peak hours
- Use connection pooling
- Implement parallel processing for large datasets
- Consider partitioning large tables

## 🔄 Maintenance

### Regular Tasks

1. **Monthly**: Review cleanup statistics and adjust configuration
2. **Quarterly**: Analyze storage usage trends
3. **Annually**: Review and rotate secrets

### Backup Strategy

- Ensure cleanup doesn't interfere with backups
- Test restore procedures with cleanup data
- Consider retention policies for deleted data

## 📞 Support

For deployment issues:
1. Check the logs first
2. Verify environment variables
3. Test with dry-run mode
4. Check database connectivity
5. Review cron job configuration

For additional help, refer to the main autosave documentation or contact the development team.