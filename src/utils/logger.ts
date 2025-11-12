export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
  }

  setLevel(level: LogLevel) {
    this.level = level;
  }

  error(message: string, ...args: unknown[]) {
    console.error(`[ERROR] ${message}`, ...args);
  }

  warn(message: string, ...args: unknown[]) {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]) {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  debug(message: string, ...args: unknown[]) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    return levels.indexOf(level) <= levels.indexOf(this.level);
  }
}

export const logger = new Logger();
