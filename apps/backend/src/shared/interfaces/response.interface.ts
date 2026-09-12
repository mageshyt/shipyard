export type { StandardResponse } from '@workspace/types';

export interface UserExecutionContext {
  user?: {
    id: string;
    email: string;
  };
}
