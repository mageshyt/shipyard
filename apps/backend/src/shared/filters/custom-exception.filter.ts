import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';

@Catch()
export class CustomExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly formatFn: (exception: any, host: ArgumentsHost) => any,
  ) {}

  catch(exception: any, host: ArgumentsHost) {
    return this.formatFn(exception, host);
  }
}

export function createCustomExceptionFilter(
  formatFn: (exception: any, host: ArgumentsHost) => any,
) {
  return new CustomExceptionFilter(formatFn);
}
