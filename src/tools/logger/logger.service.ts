// logging.service.ts
import { Injectable } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class LoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    const { combine, timestamp, json } = winston.format;
    this.logger = winston.createLogger({
      format: combine(timestamp(), json()),
      transports: [
        new winston.transports.File({
          filename: 'logs/log.json',
        }),
        new winston.transports.Console({
          format: winston.format.combine(
            // Add a timestamp to the console logs
            winston.format.timestamp(),
            // Add colors to you logs
            winston.format.colorize(),
            // What the details you need as logs
            winston.format.printf(
              ({ timestamp, level, message, context, trace }) => {
                return `${timestamp} [${context}] ${level}: ${message}${
                  trace ? `\n${trace}` : ''
                }`;
              },
            ),
          ),
        }),
      ],
    });
  }
  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace: string, context?: string) {
    this.logger.error(message, { context, trace });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }
}
