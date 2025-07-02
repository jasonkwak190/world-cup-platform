// This file configures the initialization of Sentry on the browser/client side.
// The config you add here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Define how likely Sentry is to send a given transaction to Sentry
  tracesSampleRate: 1.0,
  
  // Define how likely Sentry is to send a given session replay to Sentry
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  debug: false,
  
  environment: process.env.NODE_ENV,
  
  // Custom integrations
  integrations: [
    // Performance monitoring integration would go here
    // Note: Specific Sentry integrations may vary by version
  ],
  
  // Custom error filtering
  beforeSend(event, hint) {
    // Filter out certain errors
    if (event.exception) {
      const error = event.exception.values?.[0];
      
      // Filter out common non-critical errors
      if (error?.type === 'ChunkLoadError' || 
          error?.value?.includes('Loading chunk') ||
          error?.value?.includes('ChunkLoadError')) {
        return null;
      }
      
      // Filter out network errors
      if (error?.type === 'NetworkError' ||
          error?.value?.includes('fetch')) {
        return null;
      }
    }
    
    return event;
  },
  
  // Custom release tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'development',
});