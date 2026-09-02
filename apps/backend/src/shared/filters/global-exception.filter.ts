import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    const errorResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error' };

    const error =
      typeof errorResponse === 'object' && errorResponse !== null
        ? errorResponse['error'] || message
        : message;

    response.status(status).json({
      success: false,
      error,
      message:
        typeof errorResponse === 'object' &&
        errorResponse !== null &&
        errorResponse['message']
          ? errorResponse['message'].toString()
          : message,
    });
  }
}
