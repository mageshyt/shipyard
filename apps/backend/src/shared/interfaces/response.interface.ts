export interface StandardResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface UserExecutionContext {
  user?: {
    id: string;
    email: string;
  };
}
