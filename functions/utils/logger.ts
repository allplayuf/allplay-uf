/**
 * Structured Logging Utility
 * Provides consistent logging with correlation IDs and structured data
 */

// Log levels
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const CURRENT_LOG_LEVEL = LOG_LEVELS[Deno.env.get('LOG_LEVEL') || 'INFO'];

/**
 * Generate correlation ID for request tracing
 */
export function generateCorrelationId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Format log entry with structured data
 */
function formatLog(level, message, data = {}, correlationId = null) {
  const timestamp = new Date().toISOString();
  const entry = {
    timestamp,
    level,
    message,
    correlationId,
    ...data
  };
  
  // Add environment info
  if (Deno.env.get('DENO_DEPLOYMENT_ID')) {
    entry.deploymentId = Deno.env.get('DENO_DEPLOYMENT_ID');
  }
  
  return entry;
}

/**
 * Logger class
 */
export class Logger {
  constructor(context = 'app', correlationId = null) {
    this.context = context;
    this.correlationId = correlationId || generateCorrelationId();
  }

  debug(message, data = {}) {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.DEBUG) {
      const entry = formatLog('DEBUG', message, { ...data, context: this.context }, this.correlationId);
      console.log(JSON.stringify(entry));
    }
  }

  info(message, data = {}) {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.INFO) {
      const entry = formatLog('INFO', message, { ...data, context: this.context }, this.correlationId);
      console.log(JSON.stringify(entry));
    }
  }

  warn(message, data = {}) {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.WARN) {
      const entry = formatLog('WARN', message, { ...data, context: this.context }, this.correlationId);
      console.warn(JSON.stringify(entry));
    }
  }

  error(message, error = null, data = {}) {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.ERROR) {
      const errorData = error ? {
        errorMessage: error.message,
        errorStack: error.stack,
        errorName: error.name
      } : {};
      
      const entry = formatLog('ERROR', message, { ...data, ...errorData, context: this.context }, this.correlationId);
      console.error(JSON.stringify(entry));
    }
  }

  /**
   * Log key user actions
   */
  logAction(action, userId, data = {}) {
    this.info(`User action: ${action}`, { userId, action, ...data });
  }

  /**
   * Log API request
   */
  logRequest(method, path, userId = null) {
    this.info('API Request', { method, path, userId });
  }

  /**
   * Log API response
   */
  logResponse(method, path, status, duration) {
    this.info('API Response', { method, path, status, durationMs: duration });
  }
}

/**
 * Create logger from request with correlation ID from header
 */
export function createLoggerFromRequest(req, context = 'app') {
  const correlationId = req.headers.get('x-correlation-id') || generateCorrelationId();
  return new Logger(context, correlationId);
}