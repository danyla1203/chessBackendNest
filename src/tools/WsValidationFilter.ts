import {
  Catch,
  ArgumentsHost,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';

@Catch(BadRequestException, NotFoundException, ConflictException)
export class WsValidationFilter extends BaseWsExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const properException = new WsException(exception.getResponse());
    super.catch(properException, host);
  }
}
