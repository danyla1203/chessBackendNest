import {
  Catch,
  ArgumentsHost,
  HttpServer,
  HttpException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { LoggerService } from './logger.service';

@Catch()
export class LoggerFilter extends BaseExceptionFilter {
  constructor(
    private readonly loggerService: LoggerService,
    httpSever: HttpServer,
  ) {
    super(httpSever);
  }
  catch(exception: unknown, host: ArgumentsHost) {
    if (exception instanceof HttpException) {
      this.loggerService.error(exception.message, '', exception.name);
    } else {
      this.loggerService.error('Unhandled error', '');
    }
    super.catch(exception, host);
  }
}
