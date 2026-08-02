export type ErrorCategory = 
  | 'VALIDATION' 
  | 'NETWORK' 
  | 'AUTH' 
  | 'STORAGE' 
  | 'API' 
  | 'SERVER' 
  | 'UNKNOWN';

export type ErrorSeverity = 
  | 'INFO' 
  | 'WARNING' 
  | 'ERROR' 
  | 'FATAL';

export interface AppErrorOptions {
  code: string;
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  userMessage: string;
  technicalDetails?: any;
  retryable?: boolean;
}

export class AppError extends Error {
  public code: string;
  public category: ErrorCategory;
  public severity: ErrorSeverity;
  public userMessage: string;
  public technicalDetails: any;
  public retryable: boolean;

  constructor(options: AppErrorOptions) {
    // Call the parent Error constructor with a technical summary
    super(`${options.code}: ${options.userMessage}`);
    
    // Maintain prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);

    this.name = 'AppError';
    this.code = options.code;
    this.category = options.category || 'UNKNOWN';
    this.severity = options.severity || 'ERROR';
    this.userMessage = options.userMessage;
    this.technicalDetails = options.technicalDetails || null;
    this.retryable = options.retryable ?? false;
  }
}
