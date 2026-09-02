import { SetMetadata } from '@nestjs/common';

export const SKIP_STANDARD_RESPONSE_KEY = 'skip_standard_response';

export const SkipStandardResponse = () =>
  SetMetadata(SKIP_STANDARD_RESPONSE_KEY, true);
