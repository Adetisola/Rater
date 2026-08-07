export type LogLevel = 'info' | 'warn' | 'error' | 'security';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId: string;
  context?: Record<string, any>;
  userId?: string;
  ip?: string;
}

export class RequestLogger {
  private requestId: string;

  constructor(requestId?: string) {
    this.requestId = requestId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15));
  }

  public getRequestId(): string {
    return this.requestId;
  }

  public log(level: LogLevel, message: string, context?: Record<string, any>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      requestId: this.requestId,
      ...context
    };

    // We use JSON.stringify for structured logging which is easily parseable by DataDog, CloudWatch, etc.
    const formattedLog = JSON.stringify(entry);

    if (level === 'error' || level === 'security') {
      console.error(formattedLog);
    } else if (level === 'warn') {
      console.warn(formattedLog);
    } else {
      console.log(formattedLog);
    }
  }

  public info(message: string, context?: Record<string, any>) {
    this.log('info', message, context);
  }

  public warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context);
  }

  public error(message: string, context?: Record<string, any>) {
    this.log('error', message, context);
  }

  public security(message: string, context?: Record<string, any>) {
    this.log('security', message, context);
  }
}

// Global default logger for non-request specific logs
export const globalLogger = new RequestLogger('system-global');

export function createLogger(req?: Request) {
    // If request headers have a trace ID or request ID (e.g. from Vercel), use it
    const reqId = req?.headers.get('x-vercel-id') || req?.headers.get('x-request-id') || undefined;
    return new RequestLogger(reqId);
}
