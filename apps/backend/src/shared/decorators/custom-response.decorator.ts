import { SetMetadata, UseInterceptors, applyDecorators } from '@nestjs/common';
import { CustomResponseInterceptor } from '../interceptors';

export const RESPONSE_FORMAT_KEY = 'response_format';

export function CustomResponseFormat(formatFn: (data: any) => any) {
  return applyDecorators(
    SetMetadata(RESPONSE_FORMAT_KEY, true),
    UseInterceptors(new CustomResponseInterceptor(formatFn)),
  );
}
