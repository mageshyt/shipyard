import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StandardResponse } from '../interfaces/response.interface';
import { Reflector } from '@nestjs/core';
import { SKIP_STANDARD_RESPONSE_KEY } from '../decorators/skip-standard-response.decorator';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  StandardResponse<T> | T
> {
  constructor(private reflector: Reflector = new Reflector()) { }

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardResponse<T> | T> {
    const skipStandardResponse = this.reflector.get<boolean>(
      SKIP_STANDARD_RESPONSE_KEY,
      context.getHandler(),
    );

    if (skipStandardResponse) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        message: data?.message || 'Request processed successfully',
      })),
    );
  }
}
