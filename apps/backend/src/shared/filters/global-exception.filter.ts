import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';
import { ErrorExtractor } from '../util/error-extractor';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const { statusCode, error, message } = ErrorExtractor.extract(exception);

    host
      .switchToHttp()
      .getResponse<Response>()
      .status(statusCode)
      .json({ success: false, error, message });
  }
}
