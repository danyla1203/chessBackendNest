import {
  Catch,
  ArgumentsHost,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';

@Catch(BadRequestException, NotFoundException)
export class WsValidationFilter extends BaseWsExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const properException = new WsException(exception.getResponse());
    super.catch(properException, host);
  }
}
